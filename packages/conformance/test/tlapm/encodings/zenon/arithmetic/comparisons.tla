(*---
description: < and <= are arith.lt and arith.le, and > and >= swap their arguments.
ref: src/backend/zenon.ml#pp_apply
mode: encoding
outcome: proved
---*)
---- MODULE comparisons ----
EXTENDS Integers, TLAPS
THEOREM ASSUME NEW a, NEW b, a < b, a <= b PROVE b > a /\ b >= a
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

    File "./comparisons.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory comparisons imports Constant Zenon begin
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
    assumes v'6: "((less ((a_CONSTANTunde_aunde_a), (a_CONSTANTunde_bunde_a))))"
    assumes v'7: "((leq ((a_CONSTANTunde_aunde_a), (a_CONSTANTunde_bunde_a))))"
    shows "((((greater ((a_CONSTANTunde_bunde_a), (a_CONSTANTunde_aunde_a)))) \<and> ((geq ((a_CONSTANTunde_bunde_a), (a_CONSTANTunde_aunde_a))))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "v'6" (arith.lt a_CONSTANTunde_aunde_a
    a_CONSTANTunde_bunde_a)
    $hyp "v'7" (arith.le a_CONSTANTunde_aunde_a
    a_CONSTANTunde_bunde_a)
    $goal (/\ (arith.lt a_CONSTANTunde_aunde_a a_CONSTANTunde_bunde_a)
    (arith.le a_CONSTANTunde_aunde_a
    a_CONSTANTunde_bunde_a))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Hb:"(a_CONSTANTunde_aunde_a <= a_CONSTANTunde_bunde_a)" (is "?z_hb")
     using v'7 by blast
     have z_Ha:"(a_CONSTANTunde_aunde_a < a_CONSTANTunde_bunde_a)" (is "?z_ha")
     using v'6 by blast
     assume z_Hc:"(~(?z_ha&?z_hb))"
     show FALSE
     proof (rule zenon_notand [OF z_Hc])
      assume z_Hg:"(~?z_ha)"
      show FALSE
      by (rule notE [OF z_Hg z_Ha])
     next
      assume z_Hh:"(~?z_hb)"
      show FALSE
      by (rule notE [OF z_Hh z_Hb])
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "v'6" (arith.lt a_CONSTANTunde_aunde_a
    a_CONSTANTunde_bunde_a)
    $hyp "v'7" (arith.le a_CONSTANTunde_aunde_a
    a_CONSTANTunde_bunde_a)
    $goal (/\ (arith.lt a_CONSTANTunde_aunde_a a_CONSTANTunde_bunde_a)
    (arith.le a_CONSTANTunde_aunde_a
    a_CONSTANTunde_bunde_a))
---*)
