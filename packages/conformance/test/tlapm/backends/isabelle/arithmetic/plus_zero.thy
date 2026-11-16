(*---
description: simp proves x + 0 = x for x \in Nat.
ref: isabelle/IntegerArithmetic.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory plus_zero imports Constant Zenon begin
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
lemma ob'1: (* 7321bcab4b62324c34d3ce1309abba0d *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
shows "(((((a_CONSTANTunde_xunde_a) \<in> (Nat))) \<Rightarrow> ((((addint ((a_CONSTANTunde_xunde_a), ((0))))) = (a_CONSTANTunde_xunde_a)))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by simp
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
