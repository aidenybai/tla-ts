(*---
description: auto proves f[x] \in T for f \in [S -> T] and x \in S.
ref: isabelle/Functions.thy#funcSetValue
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory funcset_app imports Constant Zenon begin
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
lemma ob'1: (* bbf51ab0792ff008ca585f6fdaf56759 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_funde_a
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Tunde_a
shows "(((((((a_CONSTANTunde_funde_a) \<in> ([(a_CONSTANTunde_Sunde_a) \<rightarrow> (a_CONSTANTunde_Tunde_a)]))) \<and> (((a_CONSTANTunde_xunde_a) \<in> (a_CONSTANTunde_Sunde_a))))) \<Rightarrow> (((fapply ((a_CONSTANTunde_funde_a), (a_CONSTANTunde_xunde_a))) \<in> (a_CONSTANTunde_Tunde_a)))))"(is "PROP ?ob'1")
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
