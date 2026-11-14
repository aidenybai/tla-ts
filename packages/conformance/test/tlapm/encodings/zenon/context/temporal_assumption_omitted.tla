(*---
description: A hypothesis that Zenon cannot write, such as a fairness condition, is replaced by an omitted temporal assumption comment, and the proof still succeeds.
ref: src/backend/zenon.ml#pp_print_sequent
mode: encoding
outcome: proved
---*)
---- MODULE temporal_assumption_omitted ----
EXTENDS TLAPS
VARIABLE x
THEOREM ASSUME WF_x(x' = 1), NEW P, P PROVE P
  BY Zenon
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./temporal_assumption_omitted.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory temporal_assumption_omitted imports Constant Zenon begin
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
    fixes a_VARIABLEunde_xunde_a a_VARIABLEunde_xunde_a'
    assumes v'5: "(isa_aquot_wfa((a_VARIABLEunde_xunde_a),((((a_VARIABLEunde_xunde_hash_primea :: c)) = ((succ[0]))))))"
    fixes a_CONSTANTunde_Punde_a
    assumes v'7: "(a_CONSTANTunde_Punde_a)"
    shows "(a_CONSTANTunde_Punde_a)"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    ; omitted temporal assumption : Fair 
    $hyp "v'7" a_CONSTANTunde_Punde_a
    $goal a_CONSTANTunde_Punde_a
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"a_CONSTANTunde_Punde_a"
     using v'7 by blast
     assume z_Hb:"(~a_CONSTANTunde_Punde_a)"
     show FALSE
     by (rule notE [OF z_Hb z_Ha])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    ; omitted temporal assumption : Fair 
    $hyp "v'7" a_CONSTANTunde_Punde_a
    $goal a_CONSTANTunde_Punde_a
---*)
