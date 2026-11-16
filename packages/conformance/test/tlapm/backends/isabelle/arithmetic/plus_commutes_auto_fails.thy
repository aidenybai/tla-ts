(*---
description: >-
  auto reduces the Nat hypotheses to Int and 0 <= but leaves x + y = y + x unproved, so the theory
  fails.
ref: isabelle/IntegerArithmetic.thy
outcome: unknown
---*)
(* automatically generated -- do not edit manually *)
theory plus_commutes_auto_fails imports Constant Zenon begin
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
lemma ob'1: (* 854f8b18b7f4b3c191288e1155f0913d *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_yunde_a
shows "(((((((a_CONSTANTunde_xunde_a) \<in> (Nat))) \<and> (((a_CONSTANTunde_yunde_a) \<in> (Nat))))) \<Rightarrow> ((((addint ((a_CONSTANTunde_xunde_a), (a_CONSTANTunde_yunde_a)))) = ((addint ((a_CONSTANTunde_yunde_a), (a_CONSTANTunde_xunde_a))))))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by auto
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unknown
---*)
