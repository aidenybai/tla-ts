(*---
description: Without the assumption x \in S, simp cannot rewrite [a \in S |-> F(a)][x] and fails.
ref: isabelle/Functions.thy#fapply
outcome: unknown
---*)
(* automatically generated -- do not edit manually *)
theory simp_needs_assumption imports Constant Zenon begin
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
lemma ob'1: (* b5c7c2508d9403db0a7cec504598671e *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Funde_a
shows "(((fapply (([ a_CONSTANTunde_aunde_a \<in> (a_CONSTANTunde_Sunde_a)  \<mapsto> ((a_CONSTANTunde_Funde_a ((a_CONSTANTunde_aunde_a))))]), (a_CONSTANTunde_xunde_a))) = ((a_CONSTANTunde_Funde_a ((a_CONSTANTunde_xunde_a))))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by simp
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unknown
---*)
