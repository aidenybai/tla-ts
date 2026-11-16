(*---
description: Isabelle checks the Zenon proof of a bounded universal, which unfolds bAll_def.
ref: isabelle/Zenon.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory bounded_forall imports Constant Zenon begin
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
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Tunde_a
shows "(\<forall> a_CONSTANTunde_aunde_a \<in> (a_CONSTANTunde_Sunde_a) : (((a_CONSTANTunde_aunde_a) \<in> (((a_CONSTANTunde_Sunde_a) \<union> ({(a_CONSTANTunde_xunde_a)}))))))"(is "PROP ?ob'1")
proof -
ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
show "PROP ?ob'1"

(* BEGIN ZENON INPUT
;; obligation #1
$goal (TLA.bAll a_CONSTANTunde_Sunde_a ((a_CONSTANTunde_aunde_a) (TLA.in a_CONSTANTunde_aunde_a
(TLA.cup a_CONSTANTunde_Sunde_a
(TLA.set a_CONSTANTunde_xunde_a)))))
END ZENON  INPUT *)
(* PROOF-FOUND *)
(* BEGIN-PROOF *)
proof (rule zenon_nnpp)
 assume z_Ha:"(~bAll(a_CONSTANTunde_Sunde_a, (\<lambda>a_CONSTANTunde_aunde_a. (a_CONSTANTunde_aunde_a \\in (a_CONSTANTunde_Sunde_a \\cup {a_CONSTANTunde_xunde_a})))))" (is "~?z_hb")
 have z_Hj_z_Ha: "(~(\\A x:((x \\in a_CONSTANTunde_Sunde_a)=>(x \\in (a_CONSTANTunde_Sunde_a \\cup {a_CONSTANTunde_xunde_a}))))) == (~?z_hb)" (is "?z_hj == ?z_ha")
 by (unfold bAll_def)
 have z_Hj: "?z_hj" (is "~(\\A x : ?z_hp(x))")
 by (unfold z_Hj_z_Ha, fact z_Ha)
 have z_Hq: "(\\E x:(~((x \\in a_CONSTANTunde_Sunde_a)=>(x \\in (a_CONSTANTunde_Sunde_a \\cup {a_CONSTANTunde_xunde_a})))))" (is "\\E x : ?z_hs(x)")
 by (rule zenon_notallex_0 [of "?z_hp", OF z_Hj])
 have z_Ht: "?z_hs((CHOOSE x:(~((x \\in a_CONSTANTunde_Sunde_a)=>(x \\in (a_CONSTANTunde_Sunde_a \\cup {a_CONSTANTunde_xunde_a}))))))" (is "~(?z_hv=>?z_hw)")
 by (rule zenon_ex_choose_0 [of "?z_hs", OF z_Hq])
 have z_Hv: "?z_hv"
 by (rule zenon_notimply_0 [OF z_Ht])
 have z_Hx: "(~?z_hw)"
 by (rule zenon_notimply_1 [OF z_Ht])
 have z_Hy: "(~?z_hv)"
 by (rule zenon_notin_cup_0 [of "(CHOOSE x:(~((x \\in a_CONSTANTunde_Sunde_a)=>(x \\in (a_CONSTANTunde_Sunde_a \\cup {a_CONSTANTunde_xunde_a})))))" "a_CONSTANTunde_Sunde_a" "{a_CONSTANTunde_xunde_a}", OF z_Hx])
 show FALSE
 by (rule notE [OF z_Hy z_Hv])
qed
(* END-PROOF *)
ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
