(*---
description: A product of two sets is TLA.prod.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE product_two ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW T, NEW a \in S, NEW b \in T PROVE <<a, b>> \in S \X T
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

    File "./product_two.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory product_two imports Constant Zenon begin
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
    fixes a_CONSTANTunde_aunde_a
    assumes a_CONSTANTunde_aunde_a_in : "(a_CONSTANTunde_aunde_a \<in> (a_CONSTANTunde_Sunde_a))"
    fixes a_CONSTANTunde_bunde_a
    assumes a_CONSTANTunde_bunde_a_in : "(a_CONSTANTunde_bunde_a \<in> (a_CONSTANTunde_Tunde_a))"
    shows "(((<<(a_CONSTANTunde_aunde_a), (a_CONSTANTunde_bunde_a)>>) \<in> (((a_CONSTANTunde_Sunde_a) \<times> (a_CONSTANTunde_Tunde_a)))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $hyp "a_CONSTANTunde_aunde_a_in" (TLA.in a_CONSTANTunde_aunde_a a_CONSTANTunde_Sunde_a)
    $hyp "a_CONSTANTunde_bunde_a_in" (TLA.in a_CONSTANTunde_bunde_a a_CONSTANTunde_Tunde_a)
    $goal (TLA.in (TLA.tuple a_CONSTANTunde_aunde_a a_CONSTANTunde_bunde_a)
    (TLA.prod a_CONSTANTunde_Sunde_a a_CONSTANTunde_Tunde_a))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     have z_Ha:"(a_CONSTANTunde_aunde_a \\in a_CONSTANTunde_Sunde_a)" (is "?z_ha")
     using a_CONSTANTunde_aunde_a_in by blast
     have z_Hb:"(a_CONSTANTunde_bunde_a \\in a_CONSTANTunde_Tunde_a)" (is "?z_hb")
     using a_CONSTANTunde_bunde_a_in by blast
     assume z_Hc:"(~(<<a_CONSTANTunde_aunde_a, a_CONSTANTunde_bunde_a>> \\in prod(a_CONSTANTunde_Sunde_a, a_CONSTANTunde_Tunde_a)))" (is "~?z_hh")
     have z_Hk_z_Hc: "(~(<<a_CONSTANTunde_aunde_a, a_CONSTANTunde_bunde_a>> \\in Product(<<a_CONSTANTunde_Sunde_a, a_CONSTANTunde_Tunde_a>>))) == (~?z_hh)" (is "?z_hk == ?z_hc")
     by (unfold prod_def)
     have z_Hk: "?z_hk" (is "~?z_hl")
     by (unfold z_Hk_z_Hc, fact z_Hc)
     let ?z_hi = "<<a_CONSTANTunde_aunde_a, a_CONSTANTunde_bunde_a>>"
     have z_Ho: "isASeq(?z_hi)" (is "?z_ho")
     proof (rule zenon_nnpp)
      assume z_Hp: "(~?z_ho)"
      show FALSE using z_Hp by auto
     qed
     have z_Hq: "(Len(?z_hi)=2)" (is "?z_hr=?z_hs")
     proof (rule zenon_nnpp)
      assume z_Ht: "(?z_hr~=?z_hs)"
      have z_Hq: "(?z_hr=?z_hs)"
      by auto
      have z_Hu: "(?z_hs~=?z_hs)"
      by (rule subst [where P="(\<lambda>zenon_Vt. (zenon_Vt~=?z_hs))", OF z_Hq z_Ht])
      show FALSE
      by (rule zenon_noteq [OF z_Hu])
     qed
     have z_Hy: "((?z_hi[1]) \\in a_CONSTANTunde_Sunde_a)" (is "?z_hy")
     proof (rule zenon_nnpp)
      assume z_Hbb: "(~?z_hy)"
      have z_Hbc: "((?z_hi[1])=a_CONSTANTunde_aunde_a)" (is "?z_hz=_")
      by auto
      have z_Hbd: "(~?z_ha)"
      by (rule subst [where P="(\<lambda>zenon_Vr. (~(zenon_Vr \\in a_CONSTANTunde_Sunde_a)))", OF z_Hbc z_Hbb])
      show FALSE
      by (rule notE [OF z_Hbd z_Ha])
     qed
     have z_Hbi: "((?z_hi[?z_hs]) \\in a_CONSTANTunde_Tunde_a)" (is "?z_hbi")
     proof (rule zenon_nnpp)
      assume z_Hbk: "(~?z_hbi)"
      have z_Hbl: "((?z_hi[?z_hs])=a_CONSTANTunde_bunde_a)" (is "?z_hbj=_")
      by auto
      have z_Hbm: "(~?z_hb)"
      by (rule subst [where P="(\<lambda>zenon_Vn. (~(zenon_Vn \\in a_CONSTANTunde_Tunde_a)))", OF z_Hbl z_Hbk])
      show FALSE
      by (rule notE [OF z_Hbm z_Hb])
     qed
     show FALSE using z_Hk z_Ho z_Hq z_Hy z_Hbi inProductI[where s="<<a_CONSTANTunde_Sunde_a, a_CONSTANTunde_Tunde_a>>"] by auto
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $hyp "a_CONSTANTunde_aunde_a_in" (TLA.in a_CONSTANTunde_aunde_a a_CONSTANTunde_Sunde_a)
    $hyp "a_CONSTANTunde_bunde_a_in" (TLA.in a_CONSTANTunde_bunde_a a_CONSTANTunde_Tunde_a)
    $goal (TLA.in (TLA.tuple a_CONSTANTunde_aunde_a a_CONSTANTunde_bunde_a)
    (TLA.prod a_CONSTANTunde_Sunde_a a_CONSTANTunde_Tunde_a))
---*)
