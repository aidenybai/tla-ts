(*---
description: An unbounded \A is A. with a lambda binder.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE forall_unbounded ----
EXTENDS TLAPS
THEOREM \A x : x = x
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

    File "./forall_unbounded.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory forall_unbounded imports Constant Zenon begin
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
    shows "(\<forall>a_CONSTANTunde_xunde_a : (((a_CONSTANTunde_xunde_a) = (a_CONSTANTunde_xunde_a))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (A. ((a_CONSTANTunde_xunde_a) (= a_CONSTANTunde_xunde_a
    a_CONSTANTunde_xunde_a)))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(~(\\A a_CONSTANTunde_xunde_a:(a_CONSTANTunde_xunde_a=a_CONSTANTunde_xunde_a)))" (is "~(\\A x : ?z_he(x))")
     have z_Hf: "(\\E a_CONSTANTunde_xunde_a:(a_CONSTANTunde_xunde_a~=a_CONSTANTunde_xunde_a))" (is "\\E x : ?z_hh(x)")
     by (rule zenon_notallex_0 [of "?z_he", OF z_Ha])
     have z_Hi: "?z_hh((CHOOSE a_CONSTANTunde_xunde_a:(a_CONSTANTunde_xunde_a~=a_CONSTANTunde_xunde_a)))" (is "?z_hj~=_")
     by (rule zenon_ex_choose_0 [of "?z_hh", OF z_Hf])
     show FALSE
     by (rule zenon_noteq [OF z_Hi])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (A. ((a_CONSTANTunde_xunde_a) (= a_CONSTANTunde_xunde_a
    a_CONSTANTunde_xunde_a)))
---*)
