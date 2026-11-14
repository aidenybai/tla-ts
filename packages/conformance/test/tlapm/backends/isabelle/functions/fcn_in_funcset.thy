(*---
description: auto proves a function constructor is in [S -> T] with inFuncSet.
ref: isabelle/Functions.thy#inFuncSet
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory fcn_in_funcset imports Constant Zenon begin
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
lemma ob'1: (* a7c305936a90c35b9f6e555b4afc56fb *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Tunde_a
fixes a_CONSTANTunde_Funde_a
shows "(((\<forall> a_CONSTANTunde_aunde_a \<in> (a_CONSTANTunde_Sunde_a) : ((((a_CONSTANTunde_Funde_a ((a_CONSTANTunde_aunde_a)))) \<in> (a_CONSTANTunde_Tunde_a)))) \<Rightarrow> ((([ a_CONSTANTunde_aunde_a \<in> (a_CONSTANTunde_Sunde_a)  \<mapsto> ((a_CONSTANTunde_Funde_a ((a_CONSTANTunde_aunde_a))))]) \<in> ([(a_CONSTANTunde_Sunde_a) \<rightarrow> (a_CONSTANTunde_Tunde_a)])))))"(is "PROP ?ob'1")
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
