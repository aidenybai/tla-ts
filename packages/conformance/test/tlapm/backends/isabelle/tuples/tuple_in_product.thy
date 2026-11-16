(*---
description: auto proves <<x, y>> \in S \X T.
ref: isabelle/Tuples.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory tuple_in_product imports Constant Zenon begin
consts
  "isReal" :: c
  "isa_slas_a" :: "[c,c] => c"
  "isa_bksl_diva" :: "[c,c] => c"
  "isa_perc_a" :: "[c,c] => c"
  "isa_peri_peri_a" :: "[c,c] => c"
  "isInfinity" :: c
  "isa_lbrk_rbrk_a" :: "[c] => c"
  "isa_less_more_a" :: "[c] => c"

(* Generated from file "./G.tla", line 5, characters 3-4 *)
lemma ob'1: (* a3ddccc972e1383a791892c5ada19f50 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_yunde_a
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Tunde_a
shows "(((((((a_CONSTANTunde_xunde_a) \<in> (a_CONSTANTunde_Sunde_a))) \<and> (((a_CONSTANTunde_yunde_a) \<in> (a_CONSTANTunde_Tunde_a))))) \<Rightarrow> (((<<(a_CONSTANTunde_xunde_a), (a_CONSTANTunde_yunde_a)>>) \<in> (((a_CONSTANTunde_Sunde_a) \<times> (a_CONSTANTunde_Tunde_a)))))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by auto
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
