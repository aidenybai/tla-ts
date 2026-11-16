(*---
description: \cup, \cap and \ are TLA.cup, TLA.cap and TLA.setminus.
ref: src/backend/zenon.ml#pp_apply
mode: encoding
outcome: proved
---*)
---- MODULE operators ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW T, NEW x \in S \cap T PROVE x \in (S \cup T) \ {}
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

    File "./operators.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory operators imports Constant Zenon begin
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
    fixes a_CONSTANTunde_Tunde_a
    fixes a_CONSTANTunde_xunde_a
    assumes a_CONSTANTunde_xunde_a_in : "(a_CONSTANTunde_xunde_a \<in> (((a_CONSTANTunde_Sunde_a) \<inter> (a_CONSTANTunde_Tunde_a))))"
    shows "(((a_CONSTANTunde_xunde_a) \<in> (((((a_CONSTANTunde_Sunde_a) \<union> (a_CONSTANTunde_Tunde_a))) \\ ({})))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "a_CONSTANTunde_xunde_a_in" (TLA.in a_CONSTANTunde_xunde_a (TLA.cap a_CONSTANTunde_Sunde_a
    a_CONSTANTunde_Tunde_a))
    $goal (TLA.in a_CONSTANTunde_xunde_a
    (TLA.setminus (TLA.cup a_CONSTANTunde_Sunde_a a_CONSTANTunde_Tunde_a)
    TLA.emptyset))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"(a_CONSTANTunde_xunde_a \\in (a_CONSTANTunde_Sunde_a \\cap a_CONSTANTunde_Tunde_a))" (is "?z_ha")
     using a_CONSTANTunde_xunde_a_in by blast
     assume z_Hb:"(~(a_CONSTANTunde_xunde_a \\in ((a_CONSTANTunde_Sunde_a \\cup a_CONSTANTunde_Tunde_a) \\ {})))" (is "~?z_hg")
     have z_Hk: "(a_CONSTANTunde_xunde_a \\in a_CONSTANTunde_Sunde_a)" (is "?z_hk")
     by (rule zenon_in_cap_0 [of "a_CONSTANTunde_xunde_a" "a_CONSTANTunde_Sunde_a" "a_CONSTANTunde_Tunde_a", OF z_Ha])
     show FALSE
     proof (rule zenon_notin_setminus [of "a_CONSTANTunde_xunde_a" "(a_CONSTANTunde_Sunde_a \\cup a_CONSTANTunde_Tunde_a)" "{}", OF z_Hb])
      assume z_Hl:"(~(a_CONSTANTunde_xunde_a \\in (a_CONSTANTunde_Sunde_a \\cup a_CONSTANTunde_Tunde_a)))" (is "~?z_hm")
      have z_Hn: "(~?z_hk)"
      by (rule zenon_notin_cup_0 [of "a_CONSTANTunde_xunde_a" "a_CONSTANTunde_Sunde_a" "a_CONSTANTunde_Tunde_a", OF z_Hl])
      show FALSE
      by (rule notE [OF z_Hn z_Hk])
     next
      assume z_Ho:"(a_CONSTANTunde_xunde_a \\in {})" (is "?z_ho")
      show FALSE
      by (rule zenon_in_emptyset [of "a_CONSTANTunde_xunde_a", OF z_Ho])
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "a_CONSTANTunde_xunde_a_in" (TLA.in a_CONSTANTunde_xunde_a (TLA.cap a_CONSTANTunde_Sunde_a
    a_CONSTANTunde_Tunde_a))
    $goal (TLA.in a_CONSTANTunde_xunde_a
    (TLA.setminus (TLA.cup a_CONSTANTunde_Sunde_a a_CONSTANTunde_Tunde_a)
    TLA.emptyset))
---*)
