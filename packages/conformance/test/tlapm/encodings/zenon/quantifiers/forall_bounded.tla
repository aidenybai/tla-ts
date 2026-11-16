(*---
description: A bounded \A is TLA.bAll over its bound.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE forall_bounded ----
EXTENDS TLAPS
THEOREM ASSUME NEW S PROVE \A x \in S : x \in S
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

    File "./forall_bounded.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory forall_bounded imports Constant Zenon begin
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
    shows "(\<forall> a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a) : (((a_CONSTANTunde_xunde_a) \<in> (a_CONSTANTunde_Sunde_a))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (TLA.bAll a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) (TLA.in a_CONSTANTunde_xunde_a
    a_CONSTANTunde_Sunde_a)))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(~bAll(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. (a_CONSTANTunde_xunde_a \\in a_CONSTANTunde_Sunde_a))))" (is "~?z_hb")
     have z_Hg_z_Ha: "(~(\\A x:((x \\in a_CONSTANTunde_Sunde_a)=>(x \\in a_CONSTANTunde_Sunde_a)))) == (~?z_hb)" (is "?z_hg == ?z_ha")
     by (unfold bAll_def)
     have z_Hg: "?z_hg" (is "~(\\A x : ?z_hl(x))")
     by (unfold z_Hg_z_Ha, fact z_Ha)
     have z_Hm: "(\\E x:(~((x \\in a_CONSTANTunde_Sunde_a)=>(x \\in a_CONSTANTunde_Sunde_a))))" (is "\\E x : ?z_ho(x)")
     by (rule zenon_notallex_0 [of "?z_hl", OF z_Hg])
     have z_Hp: "?z_ho((CHOOSE x:(~((x \\in a_CONSTANTunde_Sunde_a)=>(x \\in a_CONSTANTunde_Sunde_a)))))" (is "~(?z_hr=>_)")
     by (rule zenon_ex_choose_0 [of "?z_ho", OF z_Hm])
     have z_Hr: "?z_hr"
     by (rule zenon_notimply_0 [OF z_Hp])
     have z_Hs: "(~?z_hr)"
     by (rule zenon_notimply_1 [OF z_Hp])
     show FALSE
     by (rule notE [OF z_Hs z_Hr])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (TLA.bAll a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) (TLA.in a_CONSTANTunde_xunde_a
    a_CONSTANTunde_Sunde_a)))
---*)
