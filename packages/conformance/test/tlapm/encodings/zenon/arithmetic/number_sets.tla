(*---
description: Nat, Int and a..b are arith.N, arith.Z and arith.intrange.
ref: src/backend/zenon.ml#pp_apply
mode: encoding
outcome: proved
---*)
---- MODULE number_sets ----
EXTENDS Integers, TLAPS
THEOREM ASSUME NEW a \in Nat, Nat \subseteq Int PROVE a \in Int /\ (a..a) = (a..a)
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

    File "./number_sets.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory number_sets imports Constant Zenon begin
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
    assumes a_CONSTANTunde_aunde_a_in : "(a_CONSTANTunde_aunde_a \<in> (Nat))"
    assumes v'5: "(((Nat) \<subseteq> (Int)))"
    shows "(((((a_CONSTANTunde_aunde_a) \<in> (Int))) \<and> ((((intvl ((a_CONSTANTunde_aunde_a), (a_CONSTANTunde_aunde_a)))) = ((intvl ((a_CONSTANTunde_aunde_a), (a_CONSTANTunde_aunde_a))))))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "a_CONSTANTunde_aunde_a_in" (TLA.in a_CONSTANTunde_aunde_a arith.N)
    $hyp "v'5" (TLA.subseteq arith.N
    arith.Z)
    $goal (/\ (TLA.in a_CONSTANTunde_aunde_a arith.Z)
    (= (arith.intrange a_CONSTANTunde_aunde_a a_CONSTANTunde_aunde_a)
    (arith.intrange a_CONSTANTunde_aunde_a
    a_CONSTANTunde_aunde_a)))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Hb:"(Nat \\subseteq Int)" (is "?z_hb")
     using v'5 by blast
     have z_Ha:"(a_CONSTANTunde_aunde_a \\in Nat)" (is "?z_ha")
     using a_CONSTANTunde_aunde_a_in by blast
     assume z_Hc:"(~((a_CONSTANTunde_aunde_a \\in Int)&(isa'dotdot(a_CONSTANTunde_aunde_a, a_CONSTANTunde_aunde_a)=isa'dotdot(a_CONSTANTunde_aunde_a, a_CONSTANTunde_aunde_a))))" (is "~(?z_hh&?z_hi)")
     have z_Hk_z_Hb: "bAll(Nat, (\<lambda>x. (x \\in Int))) == ?z_hb" (is "?z_hk == _")
     by (unfold subset_def)
     have z_Hk: "?z_hk"
     by (unfold z_Hk_z_Hb, fact z_Hb)
     have z_Ho_z_Hk: "(\\A x:((x \\in Nat)=>(x \\in Int))) == ?z_hk" (is "?z_ho == _")
     by (unfold bAll_def)
     have z_Ho: "?z_ho" (is "\\A x : ?z_hr(x)")
     by (unfold z_Ho_z_Hk, fact z_Hk)
     show FALSE
     proof (rule zenon_notand [OF z_Hc])
      assume z_Hs:"(~?z_hh)"
      have z_Ht: "?z_hr(a_CONSTANTunde_aunde_a)"
      by (rule zenon_all_0 [of "?z_hr" "a_CONSTANTunde_aunde_a", OF z_Ho])
      show FALSE
      proof (rule zenon_imply [OF z_Ht])
       assume z_Hu:"(~?z_ha)"
       show FALSE
       by (rule notE [OF z_Hu z_Ha])
      next
       assume z_Hh:"?z_hh"
       show FALSE
       by (rule notE [OF z_Hs z_Hh])
      qed
     next
      assume z_Hv:"(isa'dotdot(a_CONSTANTunde_aunde_a, a_CONSTANTunde_aunde_a)~=isa'dotdot(a_CONSTANTunde_aunde_a, a_CONSTANTunde_aunde_a))" (is "?z_hj~=_")
      show FALSE
      by (rule zenon_noteq [OF z_Hv])
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "a_CONSTANTunde_aunde_a_in" (TLA.in a_CONSTANTunde_aunde_a arith.N)
    $hyp "v'5" (TLA.subseteq arith.N
    arith.Z)
    $goal (/\ (TLA.in a_CONSTANTunde_aunde_a arith.Z)
    (= (arith.intrange a_CONSTANTunde_aunde_a a_CONSTANTunde_aunde_a)
    (arith.intrange a_CONSTANTunde_aunde_a
    a_CONSTANTunde_aunde_a)))
---*)
