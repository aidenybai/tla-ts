(*---
description: A cited fact is a $hyp line.
ref: src/backend/zenon.ml#pp_print_sequent
mode: encoding
outcome: proved
---*)
---- MODULE cited_fact ----
EXTENDS TLAPS
CONSTANT S, a
AXIOM Ax == a \in S
THEOREM \E x \in S : x = a
  BY Ax, Zenon
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 12:6:12:8
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 12:6:12:8
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 12:10:12:15
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 12:10:12:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./cited_fact.tla", line 7, character 1 to line 13, character 4:
    [INFO]: All 3 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory cited_fact imports Constant Zenon begin
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
    assumes v'7: "(((a_CONSTANTunde_aunde_a) \<in> (a_CONSTANTunde_Sunde_a)))"
    shows "(\<exists> a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a) : (((a_CONSTANTunde_xunde_a) = (a_CONSTANTunde_aunde_a))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "v'7" (TLA.in a_CONSTANTunde_aunde_a
    a_CONSTANTunde_Sunde_a)
    $goal (TLA.bEx a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) (= a_CONSTANTunde_xunde_a
    a_CONSTANTunde_aunde_a)))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"(a_CONSTANTunde_aunde_a \\in a_CONSTANTunde_Sunde_a)" (is "?z_ha")
     using v'7 by blast
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
    $hyp "v'7" (TLA.in a_CONSTANTunde_aunde_a
    a_CONSTANTunde_Sunde_a)
    $goal (TLA.bEx a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) (= a_CONSTANTunde_xunde_a
    a_CONSTANTunde_aunde_a)))
---*)
