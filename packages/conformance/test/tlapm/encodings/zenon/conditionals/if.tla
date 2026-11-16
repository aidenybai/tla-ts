(*---
description: IF is TLA.cond.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE if ----
EXTENDS TLAPS
THEOREM ASSUME NEW P, NEW a PROVE (IF P THEN a ELSE a) = a
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

    File "./if.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory if imports Constant Zenon begin
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
    fixes a_CONSTANTunde_Punde_a
    fixes a_CONSTANTunde_aunde_a
    shows "(((cond((a_CONSTANTunde_Punde_a), (a_CONSTANTunde_aunde_a), (a_CONSTANTunde_aunde_a))) = (a_CONSTANTunde_aunde_a)))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (= (TLA.cond a_CONSTANTunde_Punde_a a_CONSTANTunde_aunde_a a_CONSTANTunde_aunde_a)
    a_CONSTANTunde_aunde_a)
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(cond(a_CONSTANTunde_Punde_a, a_CONSTANTunde_aunde_a, a_CONSTANTunde_aunde_a)~=a_CONSTANTunde_aunde_a)" (is "?z_hb~=_")
     show FALSE
     proof (rule zenon_ifthenelse [of "(\<lambda>zenon_Vf. (zenon_Vf~=a_CONSTANTunde_aunde_a))" "a_CONSTANTunde_Punde_a" "a_CONSTANTunde_aunde_a" "a_CONSTANTunde_aunde_a", OF z_Ha])
      assume z_Hc:"a_CONSTANTunde_Punde_a"
      assume z_Hh:"(a_CONSTANTunde_aunde_a~=a_CONSTANTunde_aunde_a)"
      show FALSE
      by (rule zenon_noteq [OF z_Hh])
     next
      assume z_Hi:"(~a_CONSTANTunde_Punde_a)"
      assume z_Hh:"(a_CONSTANTunde_aunde_a~=a_CONSTANTunde_aunde_a)"
      show FALSE
      by (rule zenon_noteq [OF z_Hh])
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (= (TLA.cond a_CONSTANTunde_Punde_a a_CONSTANTunde_aunde_a a_CONSTANTunde_aunde_a)
    a_CONSTANTunde_aunde_a)
---*)
