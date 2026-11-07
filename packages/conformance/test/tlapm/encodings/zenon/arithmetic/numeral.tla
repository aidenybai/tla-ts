(*---
description: A numeral is written in unary as applications of TLA.Succ to 0.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE numeral ----
EXTENDS Naturals, TLAPS
THEOREM \A x : x = 3 => x = 3
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

    File "./numeral.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory numeral imports Constant Zenon begin
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
    shows "(\<forall>a_CONSTANTunde_xunde_a : (((((a_CONSTANTunde_xunde_a) = ((succ[succ[succ[0]]])))) \<Rightarrow> (((a_CONSTANTunde_xunde_a) = ((succ[succ[succ[0]]])))))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (A. ((a_CONSTANTunde_xunde_a) (=> (= a_CONSTANTunde_xunde_a
    (TLA.fapply TLA.Succ (TLA.fapply TLA.Succ (TLA.fapply TLA.Succ 0))))
    (= a_CONSTANTunde_xunde_a
    (TLA.fapply TLA.Succ (TLA.fapply TLA.Succ (TLA.fapply TLA.Succ 0)))))))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(~(\\A a_CONSTANTunde_xunde_a:((a_CONSTANTunde_xunde_a=3)=>(a_CONSTANTunde_xunde_a=3))))" (is "~(\\A x : ?z_hg(x))")
     have z_Hh: "(\\E a_CONSTANTunde_xunde_a:(~((a_CONSTANTunde_xunde_a=3)=>(a_CONSTANTunde_xunde_a=3))))" (is "\\E x : ?z_hj(x)")
     by (rule zenon_notallex_0 [of "?z_hg", OF z_Ha])
     have z_Hk: "?z_hj((CHOOSE a_CONSTANTunde_xunde_a:(~((a_CONSTANTunde_xunde_a=3)=>(a_CONSTANTunde_xunde_a=3)))))" (is "~(?z_hm=>_)")
     by (rule zenon_ex_choose_0 [of "?z_hj", OF z_Hh])
     have z_Hm: "?z_hm" (is "?z_hl=?z_hf")
     by (rule zenon_notimply_0 [OF z_Hk])
     have z_Hn: "(?z_hl~=?z_hf)"
     by (rule zenon_notimply_1 [OF z_Hk])
     show FALSE
     by (rule notE [OF z_Hn z_Hm])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (A. ((a_CONSTANTunde_xunde_a) (=> (= a_CONSTANTunde_xunde_a
    (TLA.fapply TLA.Succ (TLA.fapply TLA.Succ (TLA.fapply TLA.Succ 0))))
    (= a_CONSTANTunde_xunde_a
    (TLA.fapply TLA.Succ (TLA.fapply TLA.Succ (TLA.fapply TLA.Succ 0)))))))
---*)
