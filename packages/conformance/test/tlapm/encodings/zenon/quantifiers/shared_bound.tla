(*---
description: \A x, y \in S nests one TLA.bAll per variable over the same bound.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE shared_bound ----
EXTENDS TLAPS
THEOREM ASSUME NEW S PROVE \A x, y \in S : x \in S /\ y \in S
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

    File "./shared_bound.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory shared_bound imports Constant Zenon begin
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
    shows "(\<forall> a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a) : (\<forall> a_CONSTANTunde_yunde_a \<in> (a_CONSTANTunde_Sunde_a) : (((((a_CONSTANTunde_xunde_a) \<in> (a_CONSTANTunde_Sunde_a))) \<and> (((a_CONSTANTunde_yunde_a) \<in> (a_CONSTANTunde_Sunde_a)))))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (TLA.bAll a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) (TLA.bAll a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_yunde_a) (/\ (TLA.in a_CONSTANTunde_xunde_a
    a_CONSTANTunde_Sunde_a) (TLA.in a_CONSTANTunde_yunde_a
    a_CONSTANTunde_Sunde_a))))))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(~bAll(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_xunde_a. bAll(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_yunde_a. ((a_CONSTANTunde_xunde_a \\in a_CONSTANTunde_Sunde_a)&(a_CONSTANTunde_yunde_a \\in a_CONSTANTunde_Sunde_a)))))))" (is "~?z_hb")
     have z_Hl_z_Ha: "(~(\\A x:((x \\in a_CONSTANTunde_Sunde_a)=>bAll(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_yunde_a. ((x \\in a_CONSTANTunde_Sunde_a)&(a_CONSTANTunde_yunde_a \\in a_CONSTANTunde_Sunde_a))))))) == (~?z_hb)" (is "?z_hl == ?z_ha")
     by (unfold bAll_def)
     have z_Hl: "?z_hl" (is "~(\\A x : ?z_ht(x))")
     by (unfold z_Hl_z_Ha, fact z_Ha)
     have z_Hu: "(\\E x:(~((x \\in a_CONSTANTunde_Sunde_a)=>bAll(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_yunde_a. ((x \\in a_CONSTANTunde_Sunde_a)&(a_CONSTANTunde_yunde_a \\in a_CONSTANTunde_Sunde_a)))))))" (is "\\E x : ?z_hw(x)")
     by (rule zenon_notallex_0 [of "?z_ht", OF z_Hl])
     have z_Hx: "?z_hw((CHOOSE x:(~((x \\in a_CONSTANTunde_Sunde_a)=>bAll(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_yunde_a. ((x \\in a_CONSTANTunde_Sunde_a)&(a_CONSTANTunde_yunde_a \\in a_CONSTANTunde_Sunde_a))))))))" (is "~(?z_hz=>?z_hba)")
     by (rule zenon_ex_choose_0 [of "?z_hw", OF z_Hu])
     have z_Hz: "?z_hz"
     by (rule zenon_notimply_0 [OF z_Hx])
     have z_Hbb: "(~?z_hba)"
     by (rule zenon_notimply_1 [OF z_Hx])
     have z_Hbc_z_Hbb: "(~(\\A x:((x \\in a_CONSTANTunde_Sunde_a)=>(?z_hz&(x \\in a_CONSTANTunde_Sunde_a))))) == (~?z_hba)" (is "?z_hbc == ?z_hbb")
     by (unfold bAll_def)
     have z_Hbc: "?z_hbc" (is "~(\\A x : ?z_hbg(x))")
     by (unfold z_Hbc_z_Hbb, fact z_Hbb)
     have z_Hbh: "(\\E x:(~((x \\in a_CONSTANTunde_Sunde_a)=>(?z_hz&(x \\in a_CONSTANTunde_Sunde_a)))))" (is "\\E x : ?z_hbj(x)")
     by (rule zenon_notallex_0 [of "?z_hbg", OF z_Hbc])
     have z_Hbk: "?z_hbj((CHOOSE x:(~((x \\in a_CONSTANTunde_Sunde_a)=>(?z_hz&(x \\in a_CONSTANTunde_Sunde_a))))))" (is "~(?z_hbm=>?z_hbn)")
     by (rule zenon_ex_choose_0 [of "?z_hbj", OF z_Hbh])
     have z_Hbm: "?z_hbm"
     by (rule zenon_notimply_0 [OF z_Hbk])
     have z_Hbo: "(~?z_hbn)"
     by (rule zenon_notimply_1 [OF z_Hbk])
     show FALSE
     proof (rule zenon_notand [OF z_Hbo])
      assume z_Hbp:"(~?z_hz)"
      show FALSE
      by (rule notE [OF z_Hbp z_Hz])
     next
      assume z_Hbq:"(~?z_hbm)"
      show FALSE
      by (rule notE [OF z_Hbq z_Hbm])
     qed
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (TLA.bAll a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_xunde_a) (TLA.bAll a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_yunde_a) (/\ (TLA.in a_CONSTANTunde_xunde_a
    a_CONSTANTunde_Sunde_a) (TLA.in a_CONSTANTunde_yunde_a
    a_CONSTANTunde_Sunde_a))))))
---*)
