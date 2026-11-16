(*---
description: BY Blast runs blast, which chains two \subseteq hypotheses.
ref: library/TLAPS.tla#Blast
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory blast_subseteq_transitive imports Constant Zenon begin
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
lemma ob'1: (* d6e1452daf5f0b17bc7419da3593d09a *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Tunde_a
fixes a_CONSTANTunde_Uunde_a
shows "(((((((a_CONSTANTunde_Sunde_a) \<subseteq> (a_CONSTANTunde_Tunde_a))) \<and> (((a_CONSTANTunde_Tunde_a) \<subseteq> (a_CONSTANTunde_Uunde_a))))) \<Rightarrow> (((a_CONSTANTunde_Sunde_a) \<subseteq> (a_CONSTANTunde_Uunde_a)))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by blast
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
