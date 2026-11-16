(*---
description: SelectSeq is TLA.SelectSeq and its test operator is a lambda.
ref: src/backend/zenon.ml#pp_apply
mode: encoding
outcome: proved
---*)
---- MODULE select_seq ----
EXTENDS Sequences, TLAPS
IsA(e) == e = 1
THEOREM ASSUME NEW s PROVE SelectSeq(s, IsA) = SelectSeq(s, IsA)
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

    File "./select_seq.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory select_seq imports Constant Zenon begin
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
    (* usable definition CONSTANT_IsA_ suppressed *)
    fixes a_CONSTANTunde_sunde_a
    shows "((((SelectSeq ((a_CONSTANTunde_sunde_a), (a_CONSTANTunde_IsAunde_a)))) = ((SelectSeq ((a_CONSTANTunde_sunde_a), (a_CONSTANTunde_IsAunde_a))))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (= (TLA.SelectSeq a_CONSTANTunde_sunde_a a_CONSTANTunde_IsAunde_a)
    (TLA.SelectSeq a_CONSTANTunde_sunde_a
    a_CONSTANTunde_IsAunde_a))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(SelectSeq(a_CONSTANTunde_sunde_a, a_CONSTANTunde_IsAunde_a)~=SelectSeq(a_CONSTANTunde_sunde_a, a_CONSTANTunde_IsAunde_a))" (is "?z_hb~=_")
     show FALSE
     by (rule zenon_noteq [OF z_Ha])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (= (TLA.SelectSeq a_CONSTANTunde_sunde_a a_CONSTANTunde_IsAunde_a)
    (TLA.SelectSeq a_CONSTANTunde_sunde_a
    a_CONSTANTunde_IsAunde_a))
---*)
