(*---
description: BY Isa runs Isabelle's auto, the default tactic, which proves x \in S => x \in S \cup T.
ref: src/method.ml#default_isabelle_tactic
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory auto_default imports Constant Zenon begin
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
lemma ob'1: (* 6b0c5d4d21c57ce9e0e8140e394c5c1b *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Tunde_a
shows "(((((a_CONSTANTunde_xunde_a) \<in> (a_CONSTANTunde_Sunde_a))) \<Rightarrow> (((a_CONSTANTunde_xunde_a) \<in> (((a_CONSTANTunde_Sunde_a) \<union> (a_CONSTANTunde_Tunde_a)))))))"(is "PROP ?ob'1")
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
