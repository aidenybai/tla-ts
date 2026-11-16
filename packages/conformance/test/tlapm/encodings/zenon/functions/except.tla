(*---
description: A single EXCEPT update is TLA.except.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE except ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW T, NEW f \in [S -> T], NEW a \in S, NEW b PROVE [f EXCEPT ![a] = b][a] = b
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

    File "./except.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory except imports Constant Zenon begin
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
    fixes a_CONSTANTunde_funde_a
    assumes a_CONSTANTunde_funde_a_in : "(a_CONSTANTunde_funde_a \<in> ([(a_CONSTANTunde_Sunde_a) \<rightarrow> (a_CONSTANTunde_Tunde_a)]))"
    fixes a_CONSTANTunde_aunde_a
    assumes a_CONSTANTunde_aunde_a_in : "(a_CONSTANTunde_aunde_a \<in> (a_CONSTANTunde_Sunde_a))"
    fixes a_CONSTANTunde_bunde_a
    shows "(((fapply (([(a_CONSTANTunde_funde_a) EXCEPT ![(a_CONSTANTunde_aunde_a)] = (a_CONSTANTunde_bunde_a)]), (a_CONSTANTunde_aunde_a))) = (a_CONSTANTunde_bunde_a)))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "a_CONSTANTunde_funde_a_in" (TLA.in a_CONSTANTunde_funde_a (TLA.FuncSet a_CONSTANTunde_Sunde_a a_CONSTANTunde_Tunde_a))
    $hyp "a_CONSTANTunde_aunde_a_in" (TLA.in a_CONSTANTunde_aunde_a a_CONSTANTunde_Sunde_a)
    $goal (= (TLA.fapply (TLA.except a_CONSTANTunde_funde_a a_CONSTANTunde_aunde_a a_CONSTANTunde_bunde_a) a_CONSTANTunde_aunde_a)
    a_CONSTANTunde_bunde_a)
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"(a_CONSTANTunde_funde_a \\in FuncSet(a_CONSTANTunde_Sunde_a, a_CONSTANTunde_Tunde_a))" (is "?z_ha")
     using a_CONSTANTunde_funde_a_in by blast
     have z_Hb:"(a_CONSTANTunde_aunde_a \\in a_CONSTANTunde_Sunde_a)" (is "?z_hb")
     using a_CONSTANTunde_aunde_a_in by blast
     assume z_Hc:"((except(a_CONSTANTunde_funde_a, a_CONSTANTunde_aunde_a, a_CONSTANTunde_bunde_a)[a_CONSTANTunde_aunde_a])~=a_CONSTANTunde_bunde_a)" (is "?z_hi~=_")
     have z_Hl: "(DOMAIN(a_CONSTANTunde_funde_a)=a_CONSTANTunde_Sunde_a)" (is "?z_hm=_")
     by (rule zenon_in_funcset_1 [of "a_CONSTANTunde_funde_a" "a_CONSTANTunde_Sunde_a" "a_CONSTANTunde_Tunde_a", OF z_Ha])
     show FALSE
     proof (rule zenon_fapplyexcept [of "(\<lambda>zenon_Vf. (zenon_Vf~=a_CONSTANTunde_bunde_a))" "a_CONSTANTunde_funde_a" "a_CONSTANTunde_aunde_a" "a_CONSTANTunde_bunde_a" "a_CONSTANTunde_aunde_a", OF z_Hc])
      assume z_Hq:"(a_CONSTANTunde_aunde_a \\in ?z_hm)" (is "?z_hq")
      assume z_Hr:"(a_CONSTANTunde_aunde_a=a_CONSTANTunde_aunde_a)"
      assume z_Hs:"(a_CONSTANTunde_bunde_a~=a_CONSTANTunde_bunde_a)"
      show FALSE
      by (rule zenon_noteq [OF z_Hs])
     next
      assume z_Hq:"(a_CONSTANTunde_aunde_a \\in ?z_hm)" (is "?z_hq")
      assume z_Ht:"(a_CONSTANTunde_aunde_a~=a_CONSTANTunde_aunde_a)"
      assume z_Hu:"((a_CONSTANTunde_funde_a[a_CONSTANTunde_aunde_a])~=a_CONSTANTunde_bunde_a)" (is "?z_hv~=_")
      show FALSE
      by (rule zenon_noteq [OF z_Ht])
     next
      assume z_Hw:"(~(a_CONSTANTunde_aunde_a \\in ?z_hm))" (is "~?z_hq")
      have z_Hx: "(\\A zenon_Vn:((zenon_Vn \\in ?z_hm)<=>(zenon_Vn \\in a_CONSTANTunde_Sunde_a)))" (is "\\A x : ?z_hbc(x)")
      by (rule zenon_setequal_0 [of "?z_hm" "a_CONSTANTunde_Sunde_a", OF z_Hl])
      have z_Hbd: "?z_hbc(a_CONSTANTunde_aunde_a)"
      by (rule zenon_all_0 [of "?z_hbc" "a_CONSTANTunde_aunde_a", OF z_Hx])
      show FALSE
      proof (rule zenon_equiv [OF z_Hbd])
       assume z_Hw:"(~?z_hq)"
       assume z_Hbe:"(~?z_hb)"
       show FALSE
       by (rule notE [OF z_Hbe z_Hb])
      next
       assume z_Hq:"?z_hq"
       assume z_Hb:"?z_hb"
       show FALSE
       by (rule notE [OF z_Hw z_Hq])
      qed
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "a_CONSTANTunde_funde_a_in" (TLA.in a_CONSTANTunde_funde_a (TLA.FuncSet a_CONSTANTunde_Sunde_a a_CONSTANTunde_Tunde_a))
    $hyp "a_CONSTANTunde_aunde_a_in" (TLA.in a_CONSTANTunde_aunde_a a_CONSTANTunde_Sunde_a)
    $goal (= (TLA.fapply (TLA.except a_CONSTANTunde_funde_a a_CONSTANTunde_aunde_a a_CONSTANTunde_bunde_a) a_CONSTANTunde_aunde_a)
    a_CONSTANTunde_bunde_a)
---*)
