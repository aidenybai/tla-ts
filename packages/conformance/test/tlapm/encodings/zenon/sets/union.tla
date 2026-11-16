(*---
description: UNION is TLA.UNION.
ref: src/backend/zenon.ml#pp_apply
mode: encoding
outcome: proved
---*)
---- MODULE union ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW x \in S PROVE x \subseteq UNION S
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

    File "./union.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory union imports Constant Zenon begin
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
    fixes a_CONSTANTunde_xunde_a
    assumes a_CONSTANTunde_xunde_a_in : "(a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a))"
    shows "(((a_CONSTANTunde_xunde_a) \<subseteq> ((UNION (a_CONSTANTunde_Sunde_a)))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "a_CONSTANTunde_xunde_a_in" (TLA.in a_CONSTANTunde_xunde_a a_CONSTANTunde_Sunde_a)
    $goal (TLA.subseteq a_CONSTANTunde_xunde_a
    (TLA.UNION a_CONSTANTunde_Sunde_a))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"(a_CONSTANTunde_xunde_a \\in a_CONSTANTunde_Sunde_a)" (is "?z_ha")
     using a_CONSTANTunde_xunde_a_in by blast
     assume z_Hb:"(~(a_CONSTANTunde_xunde_a \\subseteq UNION(a_CONSTANTunde_Sunde_a)))" (is "~?z_he")
     have z_Hg_z_Hb: "(~bAll(a_CONSTANTunde_xunde_a, (\<lambda>x. (x \\in UNION(a_CONSTANTunde_Sunde_a))))) == (~?z_he)" (is "?z_hg == ?z_hb")
     by (unfold subset_def)
     have z_Hg: "?z_hg" (is "~?z_hh")
     by (unfold z_Hg_z_Hb, fact z_Hb)
     have z_Hl_z_Hg: "(~(\\A x:((x \\in a_CONSTANTunde_xunde_a)=>(x \\in UNION(a_CONSTANTunde_Sunde_a))))) == ?z_hg" (is "?z_hl == _")
     by (unfold bAll_def)
     have z_Hl: "?z_hl" (is "~(\\A x : ?z_hp(x))")
     by (unfold z_Hl_z_Hg, fact z_Hg)
     have z_Hq: "(\\E x:(~((x \\in a_CONSTANTunde_xunde_a)=>(x \\in UNION(a_CONSTANTunde_Sunde_a)))))" (is "\\E x : ?z_hs(x)")
     by (rule zenon_notallex_0 [of "?z_hp", OF z_Hl])
     have z_Ht: "?z_hs((CHOOSE x:(~((x \\in a_CONSTANTunde_xunde_a)=>(x \\in UNION(a_CONSTANTunde_Sunde_a))))))" (is "~(?z_hv=>?z_hw)")
     by (rule zenon_ex_choose_0 [of "?z_hs", OF z_Hq])
     have z_Hv: "?z_hv"
     by (rule zenon_notimply_0 [OF z_Ht])
     have z_Hx: "(~?z_hw)"
     by (rule zenon_notimply_1 [OF z_Ht])
     have z_Hy: "(~(\\E zenon_Vo:((zenon_Vo \\in a_CONSTANTunde_Sunde_a)&((CHOOSE x:(~((x \\in a_CONSTANTunde_xunde_a)=>(x \\in UNION(a_CONSTANTunde_Sunde_a))))) \\in zenon_Vo))))" (is "~(\\E x : ?z_hbe(x))")
     by (rule zenon_notin_UNION_0 [of "(CHOOSE x:(~((x \\in a_CONSTANTunde_xunde_a)=>(x \\in UNION(a_CONSTANTunde_Sunde_a)))))" "a_CONSTANTunde_Sunde_a", OF z_Hx])
     have z_Hbf: "~?z_hbe(a_CONSTANTunde_xunde_a)"
     by (rule zenon_notex_0 [of "?z_hbe" "a_CONSTANTunde_xunde_a", OF z_Hy])
     show FALSE
     proof (rule zenon_notand [OF z_Hbf])
      assume z_Hbg:"(~?z_ha)"
      show FALSE
      by (rule notE [OF z_Hbg z_Ha])
     next
      assume z_Hbh:"(~?z_hv)"
      show FALSE
      by (rule notE [OF z_Hbh z_Hv])
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "a_CONSTANTunde_xunde_a_in" (TLA.in a_CONSTANTunde_xunde_a a_CONSTANTunde_Sunde_a)
    $goal (TLA.subseteq a_CONSTANTunde_xunde_a
    (TLA.UNION a_CONSTANTunde_Sunde_a))
---*)
