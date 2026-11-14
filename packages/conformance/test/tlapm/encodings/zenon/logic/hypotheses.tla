(*---
description: Each visible hypothesis is a $hyp line named after its position, and the goal is the $goal line.
ref: src/backend/zenon.ml#pp_print_sequent
mode: encoding
outcome: proved
---*)
---- MODULE hypotheses ----
EXTENDS TLAPS
THEOREM ASSUME NEW P, NEW Q, P => Q, P PROVE Q
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

    File "./hypotheses.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory hypotheses imports Constant Zenon begin
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
    assumes v'6: "(((a_CONSTANTunde_Punde_a) \<Rightarrow> (a_CONSTANTunde_Qunde_a)))"
    assumes v'7: "(a_CONSTANTunde_Punde_a)"
    shows "(a_CONSTANTunde_Qunde_a)"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "v'6" (=> a_CONSTANTunde_Punde_a
    a_CONSTANTunde_Qunde_a)
    $hyp "v'7" a_CONSTANTunde_Punde_a
    $goal a_CONSTANTunde_Qunde_a
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"(a_CONSTANTunde_Punde_a=>a_CONSTANTunde_Qunde_a)"
     using v'6 by blast
     have z_Hb:"a_CONSTANTunde_Punde_a"
     using v'7 by blast
     assume z_Hc:"(~a_CONSTANTunde_Qunde_a)"
     show FALSE
     proof (rule zenon_imply [OF z_Ha])
      assume z_He:"(~a_CONSTANTunde_Punde_a)"
      show FALSE
      by (rule notE [OF z_He z_Hb])
     next
      assume z_Hd:"a_CONSTANTunde_Qunde_a"
      show FALSE
      by (rule notE [OF z_Hc z_Hd])
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "v'6" (=> a_CONSTANTunde_Punde_a
    a_CONSTANTunde_Qunde_a)
    $hyp "v'7" a_CONSTANTunde_Punde_a
    $goal a_CONSTANTunde_Qunde_a
---*)
