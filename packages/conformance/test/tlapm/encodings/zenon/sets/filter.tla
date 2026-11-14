(*---
description: A set filter is TLA.subsetOf with a lambda for its predicate.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE filter ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW a PROVE {x \in S : x # a} \subseteq S
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

    File "./filter.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory filter imports Constant Zenon begin
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
    shows "(((subsetOf((a_CONSTANTunde_Sunde_a), %a_CONSTANTunde_xunde_a. (((a_CONSTANTunde_xunde_a) \<noteq> (a_CONSTANTunde_aunde_a))))) \<subseteq> (a_CONSTANTunde_Sunde_a)))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (TLA.subseteq (TLA.subsetOf a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) (-. (= a_CONSTANTunde_xunde_a
    a_CONSTANTunde_aunde_a))))
    a_CONSTANTunde_Sunde_a)
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(~(subsetOf(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. (a_CONSTANTunde_xunde_a~=a_CONSTANTunde_aunde_a))) \\subseteq a_CONSTANTunde_Sunde_a))" (is "~?z_hb")
     have z_Hi_z_Ha: "(~bAll(subsetOf(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. (a_CONSTANTunde_xunde_a~=a_CONSTANTunde_aunde_a))), (\<lambda>x. (x \\in a_CONSTANTunde_Sunde_a)))) == (~?z_hb)" (is "?z_hi == ?z_ha")
     by (unfold subset_def)
     have z_Hi: "?z_hi" (is "~?z_hj")
     by (unfold z_Hi_z_Ha, fact z_Ha)
     have z_Hn_z_Hi: "(~(\\A x:((x \\in subsetOf(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. (a_CONSTANTunde_xunde_a~=a_CONSTANTunde_aunde_a))))=>(x \\in a_CONSTANTunde_Sunde_a)))) == ?z_hi" (is "?z_hn == _")
     by (unfold bAll_def)
     have z_Hn: "?z_hn" (is "~(\\A x : ?z_hr(x))")
     by (unfold z_Hn_z_Hi, fact z_Hi)
     have z_Hs: "(\\E x:(~((x \\in subsetOf(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. (a_CONSTANTunde_xunde_a~=a_CONSTANTunde_aunde_a))))=>(x \\in a_CONSTANTunde_Sunde_a))))" (is "\\E x : ?z_hu(x)")
     by (rule zenon_notallex_0 [of "?z_hr", OF z_Hn])
     have z_Hv: "?z_hu((CHOOSE x:(~((x \\in subsetOf(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. (a_CONSTANTunde_xunde_a~=a_CONSTANTunde_aunde_a))))=>(x \\in a_CONSTANTunde_Sunde_a)))))" (is "~(?z_hx=>?z_hy)")
     by (rule zenon_ex_choose_0 [of "?z_hu", OF z_Hs])
     have z_Hx: "?z_hx"
     by (rule zenon_notimply_0 [OF z_Hv])
     have z_Hz: "(~?z_hy)"
     by (rule zenon_notimply_1 [OF z_Hv])
     have z_Hy: "?z_hy"
     by (rule zenon_in_subsetof_0 [of "(CHOOSE x:(~((x \\in subsetOf(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. (a_CONSTANTunde_xunde_a~=a_CONSTANTunde_aunde_a))))=>(x \\in a_CONSTANTunde_Sunde_a))))" "a_CONSTANTunde_Sunde_a" "(\<lambda>a_CONSTANTunde_xunde_a. (a_CONSTANTunde_xunde_a~=a_CONSTANTunde_aunde_a))", OF z_Hx])
     show FALSE
     by (rule notE [OF z_Hz z_Hy])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (TLA.subseteq (TLA.subsetOf a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) (-. (= a_CONSTANTunde_xunde_a
    a_CONSTANTunde_aunde_a))))
    a_CONSTANTunde_Sunde_a)
---*)
