(*---
description: '[S -> T] is TLA.FuncSet.'
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE function_set ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW a PROVE [x \in S |-> a] \in [S -> {a}]
  BY Zenon
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./function_set.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory function_set imports Constant Zenon begin
    ML_command \<open> writeln ("*** TLAPS PARSED\n"); \<close>
    consts
      "isReal" :: c
      "isa_slas_a" :: "[c,c] => c"
      "isa_bksl_diva" :: "[c,c] => c"
      "isa_perc_a" :: "[c,c] => c"
      "isa_peri_peri_a" :: "[c,c] => c"
      "isInfinity" :: c
      "isa_lbrk_rbrk_a" :: "[c] => c"
      "isa_less_more_a" :: "[c] => c"

    lemma ob'1:
    (* usable definition CONSTANT_EnabledWrapper_ suppressed *)
    (* usable definition CONSTANT_CdotWrapper_ suppressed *)
    fixes a_CONSTANTunde_Sunde_a
    fixes a_CONSTANTunde_aunde_a
    shows "((([ a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a)  \<mapsto> (a_CONSTANTunde_aunde_a)]) \<in> ([(a_CONSTANTunde_Sunde_a) \<rightarrow> ({(a_CONSTANTunde_aunde_a)})])))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (TLA.in (TLA.Fcn a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) a_CONSTANTunde_aunde_a))
    (TLA.FuncSet a_CONSTANTunde_Sunde_a (TLA.set a_CONSTANTunde_aunde_a)))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(~(Fcn(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_aunde_a)) \\in FuncSet(a_CONSTANTunde_Sunde_a, {a_CONSTANTunde_aunde_a})))" (is "~?z_hb")
     show FALSE
     proof (rule zenon_notin_funcset [of "Fcn(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_aunde_a))" "a_CONSTANTunde_Sunde_a" "{a_CONSTANTunde_aunde_a}", OF z_Ha])
      assume z_Hi:"(~isAFcn(Fcn(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_aunde_a))))" (is "~?z_hj")
      show FALSE
      by (rule zenon_notisafcn_fcn [of "a_CONSTANTunde_Sunde_a" "(\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_aunde_a)", OF z_Hi])
     next
      assume z_Hk:"(DOMAIN(Fcn(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_aunde_a)))~=a_CONSTANTunde_Sunde_a)" (is "?z_hl~=_")
      have z_Hm: "(a_CONSTANTunde_Sunde_a~=a_CONSTANTunde_Sunde_a)"
      by (rule zenon_domain_fcn_0 [of "(\<lambda>zenon_Vs. (zenon_Vs~=a_CONSTANTunde_Sunde_a))" "a_CONSTANTunde_Sunde_a" "(\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_aunde_a)", OF z_Hk])
      show FALSE
      by (rule zenon_noteq [OF z_Hm])
     next
      assume z_Hq:"(~(\\A zenon_Vh:((zenon_Vh \\in a_CONSTANTunde_Sunde_a)=>((Fcn(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_aunde_a))[zenon_Vh]) \\in {a_CONSTANTunde_aunde_a}))))" (is "~(\\A x : ?z_hx(x))")
      have z_Hy: "(\\E zenon_Vh:(~((zenon_Vh \\in a_CONSTANTunde_Sunde_a)=>((Fcn(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_aunde_a))[zenon_Vh]) \\in {a_CONSTANTunde_aunde_a}))))" (is "\\E x : ?z_hba(x)")
      by (rule zenon_notallex_0 [of "?z_hx", OF z_Hq])
      have z_Hbb: "?z_hba((CHOOSE zenon_Vh:(~((zenon_Vh \\in a_CONSTANTunde_Sunde_a)=>((Fcn(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_aunde_a))[zenon_Vh]) \\in {a_CONSTANTunde_aunde_a})))))" (is "~(?z_hbd=>?z_hbe)")
      by (rule zenon_ex_choose_0 [of "?z_hba", OF z_Hy])
      have z_Hbd: "?z_hbd"
      by (rule zenon_notimply_0 [OF z_Hbb])
      have z_Hbf: "(~?z_hbe)"
      by (rule zenon_notimply_1 [OF z_Hbb])
      have z_Hbg: "((Fcn(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_aunde_a))[(CHOOSE zenon_Vh:(~((zenon_Vh \\in a_CONSTANTunde_Sunde_a)=>((Fcn(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_aunde_a))[zenon_Vh]) \\in {a_CONSTANTunde_aunde_a}))))])~=a_CONSTANTunde_aunde_a)" (is "?z_hbh~=_")
      by (rule zenon_notin_addElt_0 [of "?z_hbh" "a_CONSTANTunde_aunde_a" "{}", OF z_Hbf])
      show FALSE
      proof (rule zenon_fapplyfcn [of "(\<lambda>zenon_Vp. (zenon_Vp~=a_CONSTANTunde_aunde_a))" "a_CONSTANTunde_Sunde_a" "(\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_aunde_a)" "(CHOOSE zenon_Vh:(~((zenon_Vh \\in a_CONSTANTunde_Sunde_a)=>((Fcn(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. a_CONSTANTunde_aunde_a))[zenon_Vh]) \\in {a_CONSTANTunde_aunde_a}))))", OF z_Hbg])
       assume z_Hbm:"(~?z_hbd)"
       show FALSE
       by (rule notE [OF z_Hbm z_Hbd])
      next
       assume z_Hbn:"(a_CONSTANTunde_aunde_a~=a_CONSTANTunde_aunde_a)"
       show FALSE
       by (rule zenon_noteq [OF z_Hbn])
      qed
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (TLA.in (TLA.Fcn a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) a_CONSTANTunde_aunde_a))
    (TLA.FuncSet a_CONSTANTunde_Sunde_a (TLA.set a_CONSTANTunde_aunde_a)))
---*)
