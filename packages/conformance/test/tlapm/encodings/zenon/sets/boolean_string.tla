(*---
description: BOOLEAN is written as the set of T. and F., and STRING is TLA.STRING.
ref: src/backend/zenon.ml#pp_apply
mode: encoding
outcome: proved
---*)
---- MODULE boolean_string ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, BOOLEAN \subseteq S, STRING \subseteq S PROVE TRUE \in S
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

    File "./boolean_string.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory boolean_string imports Constant Zenon begin
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
    assumes v'5: "(((BOOLEAN) \<subseteq> (a_CONSTANTunde_Sunde_a)))"
    assumes v'6: "(((STRING) \<subseteq> (a_CONSTANTunde_Sunde_a)))"
    shows "(((TRUE) \<in> (a_CONSTANTunde_Sunde_a)))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "v'5" (TLA.subseteq (TLA.set T. F.)
    a_CONSTANTunde_Sunde_a)
    $hyp "v'6" (TLA.subseteq TLA.STRING a_CONSTANTunde_Sunde_a)
    $goal (TLA.in T.
    a_CONSTANTunde_Sunde_a)
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"({TRUE, FALSE} \\subseteq a_CONSTANTunde_Sunde_a)" (is "?z_ha")
     using v'5 by blast
     assume z_Hc:"(~(TRUE \\in a_CONSTANTunde_Sunde_a))" (is "~?z_hh")
     have z_Hi_z_Ha: "bAll({TRUE, FALSE}, (\<lambda>x. (x \\in a_CONSTANTunde_Sunde_a))) == ?z_ha" (is "?z_hi == _")
     by (unfold subset_def)
     have z_Hi: "?z_hi"
     by (unfold z_Hi_z_Ha, fact z_Ha)
     have z_Hm_z_Hi: "(\\A x:((x \\in {TRUE, FALSE})=>(x \\in a_CONSTANTunde_Sunde_a))) == ?z_hi" (is "?z_hm == _")
     by (unfold bAll_def)
     have z_Hm: "?z_hm" (is "\\A x : ?z_hp(x)")
     by (unfold z_Hm_z_Hi, fact z_Hi)
     have z_Hq: "?z_hp(TRUE)" (is "?z_hr=>_")
     by (rule zenon_all_0 [of "?z_hp" "TRUE", OF z_Hm])
     show FALSE
     proof (rule zenon_imply [OF z_Hq])
      assume z_Hs:"(~?z_hr)"
      have z_Ht: "(TRUE~=TRUE)" (is "?z_he~=_")
      by (rule zenon_notin_addElt_0 [of "?z_he" "?z_he" "{FALSE}", OF z_Hs])
      show FALSE
      by (rule zenon_noteq [OF z_Ht])
     next
      assume z_Hh:"?z_hh"
      show FALSE
      by (rule notE [OF z_Hc z_Hh])
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "v'5" (TLA.subseteq (TLA.set T. F.)
    a_CONSTANTunde_Sunde_a)
    $hyp "v'6" (TLA.subseteq TLA.STRING a_CONSTANTunde_Sunde_a)
    $goal (TLA.in T.
    a_CONSTANTunde_Sunde_a)
---*)
