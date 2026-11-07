(*---
description: A bounded \E is TLA.bEx over its bound.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE exists_bounded ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW a \in S PROVE \E x \in S : x = a
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

    File "./exists_bounded.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory exists_bounded imports Constant Zenon begin
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
    fixes a_CONSTANTunde_aunde_a
    assumes a_CONSTANTunde_aunde_a_in : "(a_CONSTANTunde_aunde_a \<in> (a_CONSTANTunde_Sunde_a))"
    shows "(\<exists> a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a) : (((a_CONSTANTunde_xunde_a) = (a_CONSTANTunde_aunde_a))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "a_CONSTANTunde_aunde_a_in" (TLA.in a_CONSTANTunde_aunde_a a_CONSTANTunde_Sunde_a)
    $goal (TLA.bEx a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) (= a_CONSTANTunde_xunde_a
    a_CONSTANTunde_aunde_a)))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"(a_CONSTANTunde_aunde_a \\in a_CONSTANTunde_Sunde_a)" (is "?z_ha")
     using a_CONSTANTunde_aunde_a_in by blast
     assume z_Hb:"(~bEx(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. (a_CONSTANTunde_xunde_a=a_CONSTANTunde_aunde_a))))" (is "~?z_he")
     have z_Hi_z_Hb: "(~(\\E x:((x \\in a_CONSTANTunde_Sunde_a)&(x=a_CONSTANTunde_aunde_a)))) == (~?z_he)" (is "?z_hi == ?z_hb")
     by (unfold bEx_def)
     have z_Hi: "?z_hi" (is "~(\\E x : ?z_ho(x))")
     by (unfold z_Hi_z_Hb, fact z_Hb)
     have z_Hp: "~?z_ho(a_CONSTANTunde_aunde_a)" (is "~(_&?z_hq)")
     by (rule zenon_notex_0 [of "?z_ho" "a_CONSTANTunde_aunde_a", OF z_Hi])
     show FALSE
     proof (rule zenon_notand [OF z_Hp])
      assume z_Hr:"(~?z_ha)"
      show FALSE
      by (rule notE [OF z_Hr z_Ha])
     next
      assume z_Hs:"(a_CONSTANTunde_aunde_a~=a_CONSTANTunde_aunde_a)"
      show FALSE
      by (rule zenon_noteq [OF z_Hs])
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "a_CONSTANTunde_aunde_a_in" (TLA.in a_CONSTANTunde_aunde_a a_CONSTANTunde_Sunde_a)
    $goal (TLA.bEx a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) (= a_CONSTANTunde_xunde_a
    a_CONSTANTunde_aunde_a)))
---*)
