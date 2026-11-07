(*---
description: \subseteq is TLA.subseteq and SUBSET is TLA.SUBSET.
ref: src/backend/zenon.ml#pp_apply
mode: encoding
outcome: proved
---*)
---- MODULE subseteq_subset ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW T, S \subseteq T PROVE S \in SUBSET T
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

    File "./subseteq_subset.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory subseteq_subset imports Constant Zenon begin
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
    fixes a_CONSTANTunde_Tunde_a
    assumes v'6: "(((a_CONSTANTunde_Sunde_a) \<subseteq> (a_CONSTANTunde_Tunde_a)))"
    shows "(((a_CONSTANTunde_Sunde_a) \<in> ((SUBSET (a_CONSTANTunde_Tunde_a)))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "v'6" (TLA.subseteq a_CONSTANTunde_Sunde_a
    a_CONSTANTunde_Tunde_a)
    $goal (TLA.in a_CONSTANTunde_Sunde_a
    (TLA.SUBSET a_CONSTANTunde_Tunde_a))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"(a_CONSTANTunde_Sunde_a \\subseteq a_CONSTANTunde_Tunde_a)" (is "?z_ha")
     using v'6 by blast
     assume z_Hb:"(~(a_CONSTANTunde_Sunde_a \\in SUBSET(a_CONSTANTunde_Tunde_a)))" (is "~?z_he")
     have z_Hg: "(~?z_ha)"
     by (rule zenon_notin_SUBSET_0 [of "a_CONSTANTunde_Sunde_a" "a_CONSTANTunde_Tunde_a", OF z_Hb])
     show FALSE
     by (rule notE [OF z_Hg z_Ha])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "v'6" (TLA.subseteq a_CONSTANTunde_Sunde_a
    a_CONSTANTunde_Tunde_a)
    $goal (TLA.in a_CONSTANTunde_Sunde_a
    (TLA.SUBSET a_CONSTANTunde_Tunde_a))
---*)
