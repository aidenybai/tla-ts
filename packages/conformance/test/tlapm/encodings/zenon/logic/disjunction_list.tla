(*---
description: A bulleted disjunction becomes one n-ary \/.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE disjunction_list ----
EXTENDS TLAPS
THEOREM ASSUME NEW P, NEW Q, NEW R, R PROVE
  \/ P
  \/ Q
  \/ R
  BY Zenon
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 13:3:13:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 13:6:13:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 13:6:13:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./disjunction_list.tla", line 7, character 1 to line 14, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory disjunction_list imports Constant Zenon begin
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
    fixes a_CONSTANTunde_Qunde_a
    fixes a_CONSTANTunde_Runde_a
    assumes v'7: "(a_CONSTANTunde_Runde_a)"
    shows "((a_CONSTANTunde_Punde_a) | (a_CONSTANTunde_Qunde_a) | (a_CONSTANTunde_Runde_a))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "v'7" a_CONSTANTunde_Runde_a
    $goal (\/ a_CONSTANTunde_Punde_a a_CONSTANTunde_Qunde_a
    a_CONSTANTunde_Runde_a)
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"a_CONSTANTunde_Runde_a"
     using v'7 by blast
     assume z_Hb:"(~(a_CONSTANTunde_Punde_a|(a_CONSTANTunde_Qunde_a|a_CONSTANTunde_Runde_a)))" (is "~(_|?z_he)")
     have z_Hg: "(~?z_he)"
     by (rule zenon_notor_1 [OF z_Hb])
     have z_Hh: "(~a_CONSTANTunde_Runde_a)"
     by (rule zenon_notor_1 [OF z_Hg])
     show FALSE
     by (rule notE [OF z_Hh z_Ha])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "v'7" a_CONSTANTunde_Runde_a
    $goal (\/ a_CONSTANTunde_Punde_a a_CONSTANTunde_Qunde_a
    a_CONSTANTunde_Runde_a)
---*)
