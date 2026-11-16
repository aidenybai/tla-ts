(*---
description: A product of three sets is TLA.Product of a tuple of the sets.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE product_three ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW a \in S PROVE <<a, a, a>> \in S \X S \X S
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

    File "./product_three.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory product_three imports Constant Zenon begin
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
    shows "(((<<(a_CONSTANTunde_aunde_a), (a_CONSTANTunde_aunde_a), (a_CONSTANTunde_aunde_a)>>) \<in> (Product(\<langle>(a_CONSTANTunde_Sunde_a), (a_CONSTANTunde_Sunde_a), (a_CONSTANTunde_Sunde_a)\<rangle>))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "a_CONSTANTunde_aunde_a_in" (TLA.in a_CONSTANTunde_aunde_a a_CONSTANTunde_Sunde_a)
    $goal (TLA.in (TLA.tuple a_CONSTANTunde_aunde_a a_CONSTANTunde_aunde_a
    a_CONSTANTunde_aunde_a) (TLA.Product (TLA.tuple a_CONSTANTunde_Sunde_a
    a_CONSTANTunde_Sunde_a
    a_CONSTANTunde_Sunde_a)))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"(a_CONSTANTunde_aunde_a \\in a_CONSTANTunde_Sunde_a)" (is "?z_ha")
     using a_CONSTANTunde_aunde_a_in by blast
     assume z_Hb:"(~(<<a_CONSTANTunde_aunde_a, a_CONSTANTunde_aunde_a, a_CONSTANTunde_aunde_a>> \\in Product(<<a_CONSTANTunde_Sunde_a, a_CONSTANTunde_Sunde_a, a_CONSTANTunde_Sunde_a>>)))" (is "~?z_he")
     let ?z_hf = "<<a_CONSTANTunde_aunde_a, a_CONSTANTunde_aunde_a, a_CONSTANTunde_aunde_a>>"
     have z_Hi: "isASeq(?z_hf)" (is "?z_hi")
     proof (rule zenon_nnpp)
      assume z_Hj: "(~?z_hi)"
      show FALSE using z_Hj by auto
     qed
     have z_Hk: "(Len(?z_hf)=3)" (is "?z_hl=?z_hm")
     proof (rule zenon_nnpp)
      assume z_Hn: "(?z_hl~=?z_hm)"
      have z_Hk: "(?z_hl=?z_hm)"
      by auto
      have z_Ho: "(?z_hm~=?z_hm)"
      by (rule subst [where P="(\<lambda>zenon_Vr. (zenon_Vr~=?z_hm))", OF z_Hk z_Hn])
      show FALSE
      by (rule zenon_noteq [OF z_Ho])
     qed
     have z_Hs: "((?z_hf[1]) \\in a_CONSTANTunde_Sunde_a)" (is "?z_hs")
     proof (rule zenon_nnpp)
      assume z_Hv: "(~?z_hs)"
      have z_Hw: "((?z_hf[1])=a_CONSTANTunde_aunde_a)" (is "?z_ht=_")
      by auto
      have z_Hx: "(~?z_ha)"
      by (rule subst [where P="(\<lambda>zenon_Vj. (~(zenon_Vj \\in a_CONSTANTunde_Sunde_a)))", OF z_Hw z_Hv])
      show FALSE
      by (rule notE [OF z_Hx z_Ha])
     qed
     have z_Hbc: "((?z_hf[2]) \\in a_CONSTANTunde_Sunde_a)" (is "?z_hbc")
     proof (rule zenon_nnpp)
      assume z_Hbf: "(~?z_hbc)"
      have z_Hbg: "((?z_hf[2])=a_CONSTANTunde_aunde_a)" (is "?z_hbd=_")
      by auto
      have z_Hx: "(~?z_ha)"
      by (rule subst [where P="(\<lambda>zenon_Vj. (~(zenon_Vj \\in a_CONSTANTunde_Sunde_a)))", OF z_Hbg z_Hbf])
      show FALSE
      by (rule notE [OF z_Hx z_Ha])
     qed
     have z_Hbh: "((?z_hf[?z_hm]) \\in a_CONSTANTunde_Sunde_a)" (is "?z_hbh")
     proof (rule zenon_nnpp)
      assume z_Hbj: "(~?z_hbh)"
      have z_Hbk: "((?z_hf[?z_hm])=a_CONSTANTunde_aunde_a)" (is "?z_hbi=_")
      by auto
      have z_Hx: "(~?z_ha)"
      by (rule subst [where P="(\<lambda>zenon_Vj. (~(zenon_Vj \\in a_CONSTANTunde_Sunde_a)))", OF z_Hbk z_Hbj])
      show FALSE
      by (rule notE [OF z_Hx z_Ha])
     qed
     show FALSE using z_Hb z_Hi z_Hk z_Hs z_Hbc z_Hbh inProductI[where s="<<a_CONSTANTunde_Sunde_a, a_CONSTANTunde_Sunde_a, a_CONSTANTunde_Sunde_a>>"] by auto
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "a_CONSTANTunde_aunde_a_in" (TLA.in a_CONSTANTunde_aunde_a a_CONSTANTunde_Sunde_a)
    $goal (TLA.in (TLA.tuple a_CONSTANTunde_aunde_a a_CONSTANTunde_aunde_a
    a_CONSTANTunde_aunde_a) (TLA.Product (TLA.tuple a_CONSTANTunde_Sunde_a
    a_CONSTANTunde_Sunde_a
    a_CONSTANTunde_Sunde_a)))
---*)
