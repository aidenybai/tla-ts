(*---
description: A set map with one bound is TLA.setOfAll.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE map ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW F(_), NEW x \in S PROVE F(x) \in {F(y) : y \in S}
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

    File "./map.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory map imports Constant Zenon begin
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
    fixes a_CONSTANTunde_Funde_a
    fixes a_CONSTANTunde_xunde_a
    assumes a_CONSTANTunde_xunde_a_in : "(a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a))"
    shows "((((a_CONSTANTunde_Funde_a ((a_CONSTANTunde_xunde_a)))) \<in> (setOfAll((a_CONSTANTunde_Sunde_a), %a_CONSTANTunde_yunde_a. ((a_CONSTANTunde_Funde_a ((a_CONSTANTunde_yunde_a))))))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "a_CONSTANTunde_xunde_a_in" (TLA.in a_CONSTANTunde_xunde_a a_CONSTANTunde_Sunde_a)
    $goal (TLA.in (a_CONSTANTunde_Funde_a a_CONSTANTunde_xunde_a)
    (TLA.setOfAll a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_yunde_a) (a_CONSTANTunde_Funde_a a_CONSTANTunde_yunde_a))))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"(a_CONSTANTunde_xunde_a \\in a_CONSTANTunde_Sunde_a)" (is "?z_ha")
     using a_CONSTANTunde_xunde_a_in by blast
     assume z_Hb:"(~(a_CONSTANTunde_Funde_a(a_CONSTANTunde_xunde_a) \\in setOfAll(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_yunde_a. a_CONSTANTunde_Funde_a(a_CONSTANTunde_yunde_a)))))" (is "~?z_he")
     have z_Hk: "(~(\\E zenon_Vh:((zenon_Vh \\in a_CONSTANTunde_Sunde_a)&(a_CONSTANTunde_Funde_a(a_CONSTANTunde_xunde_a)=a_CONSTANTunde_Funde_a(zenon_Vh)))))" (is "~(\\E x : ?z_hr(x))")
     by (rule zenon_notin_setofall_0 [of "a_CONSTANTunde_Funde_a(a_CONSTANTunde_xunde_a)" "a_CONSTANTunde_Sunde_a" "(\<lambda>a_CONSTANTunde_yunde_a. a_CONSTANTunde_Funde_a(a_CONSTANTunde_yunde_a))", OF z_Hb])
     have z_Hs: "~?z_hr(a_CONSTANTunde_xunde_a)" (is "~(_&?z_ht)")
     by (rule zenon_notex_0 [of "?z_hr" "a_CONSTANTunde_xunde_a", OF z_Hk])
     show FALSE
     proof (rule zenon_notand [OF z_Hs])
      assume z_Hu:"(~?z_ha)"
      show FALSE
      by (rule notE [OF z_Hu z_Ha])
     next
      assume z_Hv:"(a_CONSTANTunde_Funde_a(a_CONSTANTunde_xunde_a)~=a_CONSTANTunde_Funde_a(a_CONSTANTunde_xunde_a))" (is "?z_hf~=_")
      show FALSE
      by (rule zenon_noteq [OF z_Hv])
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "a_CONSTANTunde_xunde_a_in" (TLA.in a_CONSTANTunde_xunde_a a_CONSTANTunde_Sunde_a)
    $goal (TLA.in (a_CONSTANTunde_Funde_a a_CONSTANTunde_xunde_a)
    (TLA.setOfAll a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_yunde_a) (a_CONSTANTunde_Funde_a a_CONSTANTunde_yunde_a))))
---*)
