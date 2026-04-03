#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CanvasQuizMaker.py
GUI tool to create Canvas Classic QTI quizzes without coding.
Supported types: MC (single), MR (multi), TF, Short Answer, Numeric, Essay, Matching.
Exports a QTI 1.2 ZIP (imsmanifest.xml + quiz.xml) that imports into Canvas (Classic).
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import xml.etree.ElementTree as ET
import re
import uuid
import zipfile
import io
import html
from datetime import datetime

APP_TITLE = "Canvas QTI Quiz Maker"
VERSION = "2.0" # Updated version

# ----------------------- Helpers -----------------------

def sanitize_text(s: str) -> str:
    # Canvas tolerates basic HTML; escape critical chars
    return html.escape(s, quote=False).replace('\n', '<br/>')

def new_ident(prefix="i"):
    return f"{prefix}{uuid.uuid4().hex[:8]}"

def pretty_xml(elem):
    # Pretty print
    rough = ET.tostring(elem, encoding="utf-8")
    try:
        import xml.dom.minidom as md
        return md.parseString(rough).toprettyxml(indent="  ", encoding="utf-8")
    except Exception:
        return rough

# ----------------------- QTI Builders -----------------------

def build_qti_item(question):
    """
    Build a single QTI <item> for Canvas Classic import.
    """
    q_type = question['type']
    q_id = new_ident("item_")
    item = ET.Element("item", attrib={"ident": q_id, "title": "Question"})
    presentation = ET.SubElement(item, "presentation")

    # Stem
    material = ET.SubElement(presentation, "material")
    ET.SubElement(material, "mattext", {"texttype": "text/html"}).text = sanitize_text(question['text'])

    # Build per type
    if q_type in ("MC", "TF"):
        # Single choice
        resp = ET.SubElement(presentation, "response_lid", {"ident": "response1", "rcardinality": "Single"})
        rc = ET.SubElement(resp, "render_choice")
        labels = []
        for idx, opt in enumerate(question['answers']):
            lab_id = f"L{idx+1}"
            labels.append(lab_id)
            rlab = ET.SubElement(rc, "response_label", {"ident": lab_id})
            mat = ET.SubElement(rlab, "material")
            ET.SubElement(mat, "mattext", {"texttype": "text/html"}).text = sanitize_text(opt)

        # resprocessing (all or nothing)
        res = ET.SubElement(item, "resprocessing")
        outcomes = ET.SubElement(res, "outcomes")
        ET.SubElement(outcomes, "decvar", {"maxvalue": "100", "minvalue": "0", "varname": "SCORE", "vartype": "Decimal"})
        corr_lab = f"L{(question['correct'][0] if isinstance(question['correct'], list) else question['correct']) + 1}"
        rcorr = ET.SubElement(res, "respcondition", {"title": "correct", "continue": "No"})
        cond = ET.SubElement(rcorr, "conditionvar")
        ET.SubElement(cond, "varequal", {"respident": "response1"}).text = corr_lab
        ET.SubElement(rcorr, "setvar", {"varname": "SCORE", "action": "Set"}).text = "100"

        # Incorrect
        rinc = ET.SubElement(res, "respcondition", {"title": "incorrect", "continue": "Yes"})
        condi = ET.SubElement(rinc, "conditionvar")
        other = ET.SubElement(condi, "other")
        ET.SubElement(rinc, "setvar", {"varname": "SCORE", "action": "Set"}).text = "0"

    elif q_type == "MR":
        # Multiple response (Select all that apply), all-or-nothing
        resp = ET.SubElement(presentation, "response_lid", {"ident": "response1", "rcardinality": "Multiple"})
        rc = ET.SubElement(resp, "render_choice")
        labels = []
        for idx, opt in enumerate(question['answers']):
            lab_id = f"L{idx+1}"
            labels.append(lab_id)
            rlab = ET.SubElement(rc, "response_label", {"ident": lab_id})
            mat = ET.SubElement(rlab, "material")
            ET.SubElement(mat, "mattext", {"texttype": "text/html"}).text = sanitize_text(opt)

        correct_set = {f"L{ix+1}" for ix in question['correct']}
        # Build scoring: require exactly the correct set selected
        res = ET.SubElement(item, "resprocessing")
        outcomes = ET.SubElement(res, "outcomes")
        ET.SubElement(outcomes, "decvar", {"maxvalue": "100", "minvalue": "0", "varname": "SCORE", "vartype": "Decimal"})

        r_ok = ET.SubElement(res, "respcondition", {"title": "correct", "continue": "No"})
        cv = ET.SubElement(r_ok, "conditionvar")
        # AND of all correct selected
        andnode = ET.SubElement(cv, "and")
        for lab in correct_set:
            ET.SubElement(andnode, "varequal", {"respident": "response1"}).text = lab
        # AND NOT of all incorrect selected
        incorrect = set(labels) - correct_set
        if incorrect:
            notnode = ET.SubElement(andnode, "not")
            orbad = ET.SubElement(notnode, "or")
            for lab in incorrect:
                ET.SubElement(orbad, "varequal", {"respident": "response1"}).text = lab
        ET.SubElement(r_ok, "setvar", {"varname": "SCORE", "action": "Set"}).text = "100"

        r_bad = ET.SubElement(res, "respcondition", {"title": "incorrect", "continue": "Yes"})
        cvb = ET.SubElement(r_bad, "conditionvar")
        ET.SubElement(cvb, "other")
        ET.SubElement(r_bad, "setvar", {"varname": "SCORE", "action": "Set"}).text = "0"

    elif q_type == "ESSAY":
        ET.SubElement(presentation, "response_str", {"ident": "response1", "rcardinality": "Single"})

    elif q_type == "SHORT_ANSWER":
        # Short-answer with acceptable answers (case-insensitive)
        resp = ET.SubElement(presentation, "response_str", {"ident": "response1", "rcardinality": "Single"})
        res = ET.SubElement(item, "resprocessing")
        outcomes = ET.SubElement(res, "outcomes")
        ET.SubElement(outcomes, "decvar", {"maxvalue": "100", "minvalue": "0", "varname": "SCORE", "vartype": "Decimal"})
        r_ok = ET.SubElement(res, "respcondition", {"title": "correct", "continue": "No"})
        cv = ET.SubElement(r_ok, "conditionvar")
        ornode = ET.SubElement(cv, "or")
        for ans in question.get('short_answers', []):
            ET.SubElement(ornode, "varequal", {"respident": "response1", "case": "No"}).text = ans
        ET.SubElement(r_ok, "setvar", {"varname": "SCORE", "action": "Set"}).text = "100"
        r_bad = ET.SubElement(res, "respcondition", {"title": "incorrect", "continue": "Yes"})
        ET.SubElement(ET.SubElement(r_bad, "conditionvar"), "other")
        ET.SubElement(r_bad, "setvar", {"varname": "SCORE", "action": "Set"}).text = "0"

    elif q_type == "NUMERIC":
        # Numeric: exact or range
        presentation_num = ET.SubElement(presentation, "response_num", {"ident": "response1", "rcardinality": "Single"})
        res = ET.SubElement(item, "resprocessing")
        outcomes = ET.SubElement(res, "outcomes")
        ET.SubElement(outcomes, "decvar", {"maxvalue": "100", "minvalue": "0", "varname": "SCORE", "vartype": "Decimal"})
        r_ok = ET.SubElement(res, "respcondition", {"title": "correct", "continue": "No"})
        cv = ET.SubElement(r_ok, "conditionvar")
        num = question.get('numeric', {})
        if 'min' in num and 'max' in num:
            gte = ET.SubElement(cv, "vargte", {"respident": "response1"})
            gte.text = str(num['min'])
            lte = ET.SubElement(cv, "varlte", {"respident": "response1"})
            lte.text = str(num['max'])
        else:
            val = float(num.get('value', 0))
            tol = float(num.get('tolerance', 0))
            if tol > 0:
                gte = ET.SubElement(cv, "vargte", {"respident": "response1"})
                gte.text = str(val - tol)
                lte = ET.SubElement(cv, "varlte", {"respident": "response1"})
                lte.text = str(val + tol)
            else:
                ET.SubElement(cv, "varequal", {"respident": "response1"}).text = str(val)
        ET.SubElement(r_ok, "setvar", {"varname": "SCORE", "action": "Set"}).text = "100"
        r_bad = ET.SubElement(res, "respcondition", {"title": "incorrect", "continue": "Yes"})
        ET.SubElement(ET.SubElement(r_bad, "conditionvar"), "other")
        ET.SubElement(r_bad, "setvar", {"varname": "SCORE", "action": "Set"}).text = "0"

    elif q_type == "MATCHING":
        # Matching with render_match (simple all-or-nothing)
        resp = ET.SubElement(presentation, "response_lid", {"ident": "response1", "rcardinality": "Multiple"})
        rm = ET.SubElement(resp, "render_match")
        # Build left/right labels
        left_ids, right_ids = [], []
        for idx, (left, right) in enumerate(question.get('pairs', []), start=1):
            lid = f"S{idx}"
            rid = f"T{idx}"
            left_ids.append((lid, left))
            right_ids.append((rid, right))
        for lid, text in left_ids:
            rl = ET.SubElement(rm, "response_label", {"ident": lid})
            mat = ET.SubElement(rl, "material")
            ET.SubElement(mat, "mattext", {"texttype": "text/html"}).text = sanitize_text(text)
        for rid, text in right_ids:
            rl = ET.SubElement(rm, "response_label", {"ident": rid})
            mat = ET.SubElement(rl, "material")
            ET.SubElement(mat, "mattext", {"texttype": "text/html"}).text = sanitize_text(text)

        # Scoring: require correct mapping Sx -> Tx
        res = ET.SubElement(item, "resprocessing")
        outcomes = ET.SubElement(res, "outcomes")
        ET.SubElement(outcomes, "decvar", {"maxvalue": "100", "minvalue": "0", "varname": "SCORE", "vartype": "Decimal"})
        r_ok = ET.SubElement(res, "respcondition", {"title": "correct", "continue": "No"})
        cv = ET.SubElement(r_ok, "conditionvar")
        andnode = ET.SubElement(cv, "and")
        for idx in range(1, len(question['pairs'])+1):
            ET.SubElement(andnode, "varequal", {"respident": "response1"}).text = f"S{idx} T{idx}"
        ET.SubElement(r_ok, "setvar", {"varname": "SCORE", "action": "Set"}).text = "100"
        r_bad = ET.SubElement(res, "respcondition", {"title": "incorrect", "continue": "Yes"})
        ET.SubElement(ET.SubElement(r_bad, "conditionvar"), "other")
        ET.SubElement(r_bad, "setvar", {"varname": "SCORE", "action": "Set"}).text = "0"
    else:
        raise ValueError(f"Unsupported question type: {q_type}")

    # Points mapping
    imd = ET.SubElement(item, "itemmetadata")
    md = ET.SubElement(imd, "qtimetadata")
    f = ET.SubElement(md, "qtimetadatafield")
    ET.SubElement(f, "fieldlabel").text = "qmd_itemtype"
    ET.SubElement(f, "fieldentry").text = q_type
    f2 = ET.SubElement(md, "qtimetadatafield")
    ET.SubElement(f2, "fieldlabel").text = "points_possible"
    ET.SubElement(f2, "fieldentry").text = str(question['points'])

    return item

def build_assessment_xml(title, questions):
    root = ET.Element("questestinterop")
    assessment = ET.SubElement(root, "assessment", {"ident": new_ident("assess_"), "title": title})
    # record total points (optional metadata)
    total_points = sum(float(q["points"]) for q in questions)
    mdl = ET.SubElement(assessment, "qtimetadata")
    f = ET.SubElement(mdl, "qtimetadatafield")
    ET.SubElement(f, "fieldlabel").text = "canvas_exporter_version"
    ET.SubElement(f, "fieldentry").text = "QTI-1.2"
    f2 = ET.SubElement(mdl, "qtimetadatafield")
    ET.SubElement(f2, "fieldlabel").text = "points_possible"
    ET.SubElement(f2, "fieldentry").text = str(total_points)

    section = ET.SubElement(assessment, "section", {"ident": "root_section"})
    for q in questions:
        section.append(build_qti_item(q))
    return pretty_xml(root)

def build_manifest_xml():
    # imsmanifest minimal for Canvas
    pkg = ET.Element("manifest", {
        "identifier": new_ident("MANIFEST_"),
        "xmlns": "http://www.imsglobal.org/xsd/imscp_v1p1",
        "xmlns:imsmd": "http://www.imsglobal.org/xsd/imsmd_v1p2",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xsi:schemaLocation": "http://www.imsglobal.org/xsd/imscp_v1p1 "
                              "imscp_v1p1.xsd "
                              "http://www.imsglobal.org/xsd/imsmd_v1p2 "
                              "imsmd_v1p2p2.xsd"
    })
    resources = ET.SubElement(pkg, "resources")
    ET.SubElement(resources, "resource", {
        "identifier": "quiz1",
        "type": "imsqti_xmlv1p2",
        "href": "quiz.xml"
    })
    return pretty_xml(pkg)

# ----------------------- GUI -----------------------

class QuestionEditor(tk.Toplevel):
    def __init__(self, master, save_callback):
        super().__init__(master)
        self.title("Add / Edit Question")
        self.save_callback = save_callback
        self.geometry("720x640")
        self.resizable(True, True)

        # Vars
        self.var_type = tk.StringVar(value="MC")
        self.var_points = tk.StringVar(value="1")
        self.var_text = tk.Text(self, height=6, wrap="word")

        # Type & Points
        frm_top = ttk.Frame(self); frm_top.pack(fill="x", padx=10, pady=8)
        ttk.Label(frm_top, text="Type:").pack(side="left")
        ttk.Combobox(frm_top, textvariable=self.var_type, values=[
            "MC","MR","TF","SHORT_ANSWER","NUMERIC","ESSAY","MATCHING"
        ], state="readonly", width=16).pack(side="left", padx=6)
        ttk.Label(frm_top, text="Points:").pack(side="left", padx=(16,0))
        ttk.Entry(frm_top, textvariable=self.var_points, width=8).pack(side="left")

        # Question text
        frm_q = ttk.LabelFrame(self, text="Question Text (HTML allowed)")
        frm_q.pack(fill="both", expand=False, padx=10, pady=8)
        self.var_text.pack(in_=frm_q, fill="both", expand=True, padx=6, pady=6)

        # Dynamic area
        self.dynamic = ttk.LabelFrame(self, text="Question Options / Parameters")
        self.dynamic.pack(fill="both", expand=True, padx=10, pady=8)
        self.inner = ttk.Frame(self.dynamic); self.inner.pack(fill="both", expand=True)
        self.dynamic_widgets = []
        self.render_dynamic("MC")

        # Save/Cancel
        frm_btn = ttk.Frame(self); frm_btn.pack(fill="x", padx=10, pady=10)
        ttk.Button(frm_btn, text="Save", command=self.on_save).pack(side="right")
        ttk.Button(frm_btn, text="Cancel", command=self.destroy).pack(side="right", padx=8)

        # Type change binding
        self.var_type.trace_add('write', lambda *args: self.render_dynamic(self.var_type.get()))

    def clear_dynamic(self):
        for w in self.dynamic_widgets:
            w.destroy()
        self.dynamic_widgets = []

    def render_dynamic(self, qtype):
        self.clear_dynamic()
        # Provide UI for each type
        if qtype in ("MC","MR","TF"):
            self.opt_vars = []
            default_opts = ["True","False"] if qtype=="TF" else ["Option A","Option B","Option C","Option D"]
            frm = ttk.Frame(self.inner); frm.pack(fill="x", pady=4); self.dynamic_widgets.append(frm)

            ttk.Label(frm, text="Options (mark correct)").grid(row=0, column=0, sticky="w", pady=4)
            self.correct_vars = []
            for i, txt in enumerate(default_opts):
                ov = tk.StringVar(value=txt)
                cv = tk.BooleanVar(value=(i==1 if qtype=="TF" else False))
                self.opt_vars.append(ov); self.correct_vars.append(cv)
                ttk.Checkbutton(frm, variable=cv).grid(row=i+1, column=0, padx=4, sticky="w")
                ttk.Entry(frm, textvariable=ov, width=60).grid(row=i+1, column=1, padx=4, pady=2, sticky="w")

            # Add/Remove option buttons (for MC/MR only)
            if qtype in ("MC","MR"):
                btnf = ttk.Frame(self.inner); btnf.pack(anchor="w", pady=6); self.dynamic_widgets.append(btnf)
                ttk.Button(btnf, text="+ Add Option", command=self.add_option).pack(side="left")
                ttk.Button(btnf, text="− Remove Last", command=self.remove_option).pack(side="left", padx=8)

        elif qtype == "SHORT_ANSWER":
            ttk.Label(self.inner, text="Acceptable Answers (one per line, case-insensitive)").pack(anchor="w", pady=4)
            self.txt_short = tk.Text(self.inner, height=6)
            self.txt_short.pack(fill="x", padx=2, pady=2)
            self.dynamic_widgets += [self.txt_short]

        elif qtype == "NUMERIC":
            fr = ttk.Frame(self.inner); fr.pack(fill="x", pady=4); self.dynamic_widgets.append(fr)
            self.num_mode = tk.StringVar(value="exact")
            ttk.Radiobutton(fr, text="Exact ± Tolerance", variable=self.num_mode, value="exact").grid(row=0, column=0, sticky="w")
            ttk.Radiobutton(fr, text="Range [min, max]", variable=self.num_mode, value="range").grid(row=0, column=1, sticky="w")
            fr2 = ttk.Frame(self.inner); fr2.pack(fill="x", pady=4); self.dynamic_widgets.append(fr2)
            self.var_num_value = tk.StringVar()
            self.var_num_tol = tk.StringVar(value="0")
            self.var_num_min = tk.StringVar()
            self.var_num_max = tk.StringVar()
            ttk.Label(fr2, text="Value").grid(row=0,column=0,sticky="e"); ttk.Entry(fr2, textvariable=self.var_num_value, width=10).grid(row=0,column=1, padx=4)
            ttk.Label(fr2, text="Tolerance").grid(row=0,column=2,sticky="e"); ttk.Entry(fr2, textvariable=self.var_num_tol, width=10).grid(row=0,column=3, padx=4)
            ttk.Label(fr2, text="Min").grid(row=1,column=0,sticky="e"); ttk.Entry(fr2, textvariable=self.var_num_min, width=10).grid(row=1,column=1, padx=4)
            ttk.Label(fr2, text="Max").grid(row=1,column=2,sticky="e"); ttk.Entry(fr2, textvariable=self.var_num_max, width=10).grid(row=1,column=3, padx=4)

        elif qtype == "ESSAY":
            ttk.Label(self.inner, text="No additional settings. (Manual grading)").pack(anchor="w", pady=4)

        elif qtype == "MATCHING":
            ttk.Label(self.inner, text="Matching Pairs (Left ↔ Right) — one pair per row").pack(anchor="w", pady=4)
            self.match_frame = ttk.Frame(self.inner); self.match_frame.pack(fill="x")
            self.rows = []
            self.add_match_row()
            btnf = ttk.Frame(self.inner); btnf.pack(anchor="w", pady=6); self.dynamic_widgets += [self.match_frame, btnf]
            ttk.Button(btnf, text="+ Add Pair", command=self.add_match_row).pack(side="left")
            ttk.Button(btnf, text="− Remove Last", command=self.remove_match_row).pack(side="left", padx=8)

    def add_option(self):
        frm = self.dynamic.winfo_children()[0]
        idx = len(self.opt_vars)
        ov = tk.StringVar(value=f"Option {idx+1}")
        cv = tk.BooleanVar(False)
        self.opt_vars.append(ov); self.correct_vars.append(cv)
        row = idx+1
        ttk.Checkbutton(frm, variable=cv).grid(row=row, column=0, padx=4, sticky="w")
        ttk.Entry(frm, textvariable=ov, width=60).grid(row=row, column=1, padx=4, pady=2, sticky="w")

    def remove_option(self):
        if len(self.opt_vars) > 2:
            self.opt_vars.pop()
            self.correct_vars.pop()
            frm = self.dynamic.winfo_children()[0]
            # remove last row widgets
            for w in frm.grid_slaves(row=len(self.opt_vars)+1):
                w.destroy()

    def add_match_row(self):
        r = ttk.Frame(self.match_frame)
        vL = tk.StringVar(); vR = tk.StringVar()
        ttk.Entry(r, textvariable=vL, width=30).pack(side="left", padx=4, pady=2)
        ttk.Label(r, text="↔").pack(side="left")
        ttk.Entry(r, textvariable=vR, width=30).pack(side="left", padx=4, pady=2)
        r.pack(anchor="w")
        self.rows.append((r, vL, vR))

    def remove_match_row(self):
        if self.rows:
            r, vL, vR = self.rows.pop()
            r.destroy()

    def on_save(self):
        try:
            q = {
                "type": self.var_type.get(),
                "points": float(self.var_points.get()),
                "text": self.var_text.get("1.0","end").strip()
            }
            if not q["text"]:
                messagebox.showerror("Missing text","Please enter the question text.")
                return

            qt = q["type"]
            if qt in ("MC","MR","TF"):
                answers = [v.get().strip() for v in getattr(self, "opt_vars", [])]
                correct = [i for i, cv in enumerate(getattr(self, "correct_vars", [])) if cv.get()]
                if qt == "TF":
                    if len(answers) != 2:
                        messagebox.showerror("True/False","TF requires exactly two options (True / False).")
                        return
                if not answers or any(a=="" for a in answers):
                    messagebox.showerror("Options","Please fill all options.")
                    return
                if qt == "MC" and len(correct) != 1:
                    messagebox.showerror("Correct answer","MC needs exactly one correct option.")
                    return
                if qt in ("MR","TF") and len(correct) < 1:
                    messagebox.showerror("Correct answer","Select at least one correct option.")
                    return
                q["answers"] = answers
                q["correct"] = correct

            elif qt == "SHORT_ANSWER":
                raw = self.txt_short.get("1.0","end").strip()
                alts = [s.strip() for s in raw.splitlines() if s.strip()]
                if not alts:
                    messagebox.showerror("Answers","Add at least one acceptable answer.")
                    return
                q["short_answers"] = alts

            elif qt == "NUMERIC":
                mode = self.num_mode.get()
                if mode == "exact":
                    val = self.var_num_value.get().strip()
                    tol = self.var_num_tol.get().strip() or "0"
                    if val == "":
                        messagebox.showerror("Numeric","Enter a value.")
                        return
                    q["numeric"] = {"value": float(val), "tolerance": float(tol)}
                else:
                    vmin = self.var_num_min.get().strip()
                    vmax = self.var_num_max.get().strip()
                    if vmin == "" or vmax == "":
                        messagebox.showerror("Numeric","Enter min and max.")
                        return
                    q["numeric"] = {"min": float(vmin), "max": float(vmax)}

            elif qt == "ESSAY":
                pass

            elif qt == "MATCHING":
                pairs = []
                for _, vL, vR in self.rows:
                    L = vL.get().strip(); R = vR.get().strip()
                    if L and R:
                        pairs.append((L,R))
                if len(pairs) < 1:
                    messagebox.showerror("Matching","Add at least one pair.")
                    return
                q["pairs"] = pairs

            self.save_callback(q)
            self.destroy()
        except ValueError as e:
            messagebox.showerror("Invalid input", str(e))

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(f"{APP_TITLE} v{VERSION}")
        self.geometry("900x640")
        self.questions = []

        # Quiz title
        top = ttk.Frame(self); top.pack(fill="x", padx=12, pady=10)
        ttk.Label(top, text="Quiz Title:").pack(side="left")
        self.var_title = tk.StringVar(value="Muralismo – Video Quiz")
        ttk.Entry(top, textvariable=self.var_title, width=50).pack(side="left", padx=8)

        # Question list
        mid = ttk.Frame(self); mid.pack(fill="both", expand=True, padx=12, pady=6)
        self.tree = ttk.Treeview(mid, columns=("type","points","text"), show="headings", selectmode="browse")
        self.tree.heading("type", text="Type")
        self.tree.heading("points", text="Points")
        self.tree.heading("text", text="Question (preview)")
        self.tree.column("type", width=120, anchor="center")
        self.tree.column("points", width=80, anchor="center")
        self.tree.column("text", width=600)
        self.tree.pack(side="left", fill="both", expand=True)
        sb = ttk.Scrollbar(mid, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscroll=sb.set)
        sb.pack(side="right", fill="y")

        # Buttons
        btns = ttk.Frame(self); btns.pack(fill="x", padx=12, pady=10)
        ttk.Button(btns, text="+ Add Question", command=self.add_question).pack(side="left")
        ttk.Button(btns, text="📋 Paste Text", command=self.bulk_import).pack(side="left", padx=6)
        ttk.Button(btns, text="✎ Edit", command=self.edit_selected).pack(side="left", padx=6)
        ttk.Button(btns, text="🗑 Remove", command=self.remove_selected).pack(side="left", padx=6)
        ttk.Button(btns, text="⬇ Export QTI (.zip)", command=self.export_qti).pack(side="right")

        # Footer
        foot = ttk.Frame(self); foot.pack(fill="x", padx=12, pady=8)
        ttk.Label(foot, text="Tips: Double-click to run. Use + Add Question or 📋 Paste Text. Export to QTI and import in Canvas (Classic).").pack(anchor="w")

    def add_question(self):
        def on_save(q):
            self.questions.append(q)
            self.refresh()
        QuestionEditor(self, on_save)

    def edit_selected(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo("Edit", "Select a question to edit.")
            return
        idx = int(sel[0])
        q = self.questions[idx]

        def on_save(new_q):
            self.questions[idx] = new_q
            self.refresh()

        ed = QuestionEditor(self, on_save)
        ed.var_type.set(q["type"])
        ed.var_points.set(str(q["points"]))
        ed.var_text.insert("1.0", q["text"])

        ed.render_dynamic(q["type"])
        if q["type"] in ("MC","MR","TF"):
            for i in range(len(q["answers"]) - len(getattr(ed, "opt_vars", []))):
                ed.add_option()
            for i, opt in enumerate(q["answers"]):
                ed.opt_vars[i].set(opt)
                ed.correct_vars[i].set(i in q["correct"])
        elif q["type"] == "SHORT_ANSWER":
            ed.txt_short.insert("1.0", "\n".join(q.get("short_answers", [])))
        elif q["type"] == "NUMERIC":
            num = q.get("numeric", {})
            if "min" in num:
                ed.num_mode.set("range")
                ed.var_num_min.set(str(num["min"]))
                ed.var_num_max.set(str(num["max"]))
            else:
                ed.num_mode.set("exact")
                ed.var_num_value.set(str(num.get("value","")))
                ed.var_num_tol.set(str(num.get("tolerance","0")))
        elif q["type"] == "MATCHING":
            for _ in range(len(getattr(ed, "rows", []))):
                ed.remove_match_row()
            for L,R in q.get("pairs", []):
                ed.add_match_row()
                ed.rows[-1][1].set(L)
                ed.rows[-1][2].set(R)

    def remove_selected(self):
        sel = self.tree.selection()
        if not sel:
            return
        idx = int(sel[0])
        self.questions.pop(idx)
        self.refresh()

    def refresh(self):
        for i in self.tree.get_children():
            self.tree.delete(i)
        for i, q in enumerate(self.questions):
            text_preview = re.sub(r'<.*?>','', q['text'])
            if len(text_preview) > 120:
                text_preview = text_preview[:117] + "..."
            self.tree.insert("", "end", iid=str(i), values=(q["type"], q["points"], text_preview))

    def bulk_import(self):
        """Creates a dialog window for users to paste raw question text."""
        win = tk.Toplevel(self)
        win.title("Bulk Import Questions")
        win.geometry("600x500")

        instructions = (
            "Paste multiple choice questions below. Example format:\n\n"
            "Question: Who painted the murals in the Hospicio Cabañas?\n"
            "A. Diego Rivera\n"
            "B. David Alfaro Siqueiros\n"
            "C. José Clemente Orozco\n"
            "Answer: C."
        )
        ttk.Label(win, text=instructions).pack(anchor="w", padx=10, pady=10)
        
        text_area = tk.Text(win, wrap="word", height=20)
        text_area.pack(fill="both", expand=True, padx=10, pady=5)

        def process():
            raw_text = text_area.get("1.0", "end")
            parsed_questions = self.parse_text_format(raw_text)
            
            if parsed_questions:
                self.questions.extend(parsed_questions)
                self.refresh()
                messagebox.showinfo("Success", f"Successfully imported {len(parsed_questions)} questions.")
                win.destroy()
            else:
                messagebox.showerror("Parse Error", "No valid questions found. Please check your formatting.")

        ttk.Button(win, text="Import Text", command=process).pack(pady=10)

    def parse_text_format(self, raw_text):
        """Parses raw text blocks into QTI-compatible dictionary structures."""
        results = []
        # Split text by 'Question:' (case-insensitive)
        blocks = re.split(r'(?i)Question:\s*', raw_text)
        
        for block in blocks:
            if not block.strip(): 
                continue
            
            lines = block.strip().split('\n')
            q_text = []
            options = []
            letters = []
            ans_idx = -1

            for line in lines:
                line = line.strip()
                if not line: 
                    continue

                # Match options like "A. text" or "A) text"
                opt_match = re.match(r'^([A-Za-z])[\.\)]\s+(.*)', line)
                # Match answer like "Answer: C" or "Answer: C."
                ans_match = re.match(r'(?i)^Answer:\s*([A-Za-z])\.?', line)

                if ans_match:
                    ans_char = ans_match.group(1).upper()
                    if ans_char in letters:
                        ans_idx = letters.index(ans_char)
                elif opt_match:
                    letters.append(opt_match.group(1).upper())
                    options.append(opt_match.group(2).strip())
                else:
                    q_text.append(line)

            # Validate that we successfully parsed a complete question
            if q_text and options and ans_idx != -1:
                results.append({
                    "type": "MC",
                    "points": 1.0, # Default points for text imports
                    "text": " ".join(q_text).strip(),
                    "answers": options,
                    "correct": [ans_idx]
                })
                
        return results

    def export_qti(self):
        if not self.questions:
            messagebox.showerror("Export", "Add at least one question.")
            return
        title = self.var_title.get().strip() or "Canvas Quiz"
        try:
            assessment_xml = build_assessment_xml(title, self.questions)
            manifest_xml = build_manifest_xml()

            # Build zip in memory
            mem = io.BytesIO()
            with zipfile.ZipFile(mem, "w", zipfile.ZIP_DEFLATED) as z:
                z.writestr("imsmanifest.xml", manifest_xml)
                z.writestr("quiz.xml", assessment_xml)
            mem.seek(0)

            # Save dialog
            default_name = f"{re.sub(r'[^A-Za-z0-9_-]+','_', title)}.zip"
            path = filedialog.asksaveasfilename(
                title="Save QTI zip",
                defaultextension=".zip",
                initialfile=default_name,
                filetypes=[("QTI zip", "*.zip"), ("All files", "*.*")]
            )
            if not path:
                return
            with open(path, "wb") as f:
                f.write(mem.read())

            messagebox.showinfo("Exported",
                                "QTI package exported.\nCanvas: Settings → Import Course Content → QTI .zip file.")
        except Exception as e:
            messagebox.showerror("Export error", str(e))

if __name__ == "__main__":
    app = App()
    app.mainloop()