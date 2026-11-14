(*---
description: 'auto proves a member of {a \in S : P(a)} satisfies P.'
ref: isabelle/SetTheory.thy
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory setst_member imports Constant Zenon begin
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
lemma ob'1: (* 74ba20f71d3906bf8206f07f394a5959 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Punde_a
shows "(((((a_CONSTANTunde_xunde_a) \<in> (subsetOf((a_CONSTANTunde_Sunde_a), %a_CONSTANTunde_aunde_a. ((a_CONSTANTunde_Punde_a ((a_CONSTANTunde_aunde_a)))))))) \<Rightarrow> ((a_CONSTANTunde_Punde_a ((a_CONSTANTunde_xunde_a))))))"(is "PROP ?ob'1")
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
