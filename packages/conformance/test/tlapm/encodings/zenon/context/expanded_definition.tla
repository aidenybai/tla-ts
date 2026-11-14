(*---
description: A definition expanded with DEF is substituted and leaves a usable definition suppressed comment.
ref: src/backend/zenon.ml#pp_print_sequent
mode: encoding
outcome: proved
---*)
---- MODULE expanded_definition ----
EXTENDS TLAPS
D == {}
THEOREM ASSUME NEW a PROVE a \notin D
  BY Zenon DEF D
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

    File "./expanded_definition.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory expanded_definition imports Constant Zenon begin
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
    shows "(((a_CONSTANTunde_aunde_a) \<notin> ({})))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (-. (TLA.in a_CONSTANTunde_aunde_a
    TLA.emptyset))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(~(~(a_CONSTANTunde_aunde_a \\in {})))" (is "~~?z_hc")
     have z_Hc: "?z_hc"
     by (rule zenon_notnot_0 [OF z_Ha])
     show FALSE
     by (rule zenon_in_emptyset [of "a_CONSTANTunde_aunde_a", OF z_Hc])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (-. (TLA.in a_CONSTANTunde_aunde_a
    TLA.emptyset))
---*)
