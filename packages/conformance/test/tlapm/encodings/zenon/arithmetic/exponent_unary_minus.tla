(*---
description: ^ is arith.power and unary minus is arith.minus.
ref: src/backend/zenon.ml#pp_apply
mode: encoding
outcome: proved
---*)
---- MODULE exponent_unary_minus ----
EXTENDS Integers, TLAPS
THEOREM ASSUME NEW a, NEW b PROVE a ^ (-b) = a ^ (-b)
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

    File "./exponent_unary_minus.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory exponent_unary_minus imports Constant Zenon begin
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
    fixes a_CONSTANTunde_aunde_a
    fixes a_CONSTANTunde_bunde_a
    shows "((((isa_care_a ((a_CONSTANTunde_aunde_a), ((minus ((a_CONSTANTunde_bunde_a))))))) = ((isa_care_a ((a_CONSTANTunde_aunde_a), ((minus ((a_CONSTANTunde_bunde_a)))))))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (= (arith.power a_CONSTANTunde_aunde_a
    (arith.minus a_CONSTANTunde_bunde_a)) (arith.power a_CONSTANTunde_aunde_a
    (arith.minus a_CONSTANTunde_bunde_a)))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(power(a_CONSTANTunde_aunde_a,  -.(a_CONSTANTunde_bunde_a))~=power(a_CONSTANTunde_aunde_a,  -.(a_CONSTANTunde_bunde_a)))" (is "?z_hb~=_")
     show FALSE
     by (rule zenon_noteq [OF z_Ha])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (= (arith.power a_CONSTANTunde_aunde_a
    (arith.minus a_CONSTANTunde_bunde_a)) (arith.power a_CONSTANTunde_aunde_a
    (arith.minus a_CONSTANTunde_bunde_a)))
---*)
