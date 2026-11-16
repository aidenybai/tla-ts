(*---
description: >-
  BY IsaM("(auto, blast)") makes tlapm write by (auto, blast), which parses, but auto closes the
  goal and the sequence then fails because blast has no subgoal left.
ref: src/backend/isabelle.ml#thy_temp
outcome: unknown
---*)
(* automatically generated -- do not edit manually *)
theory auto_then_blast_parenthesized imports Constant Zenon begin
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
lemma ob'1: (* 3e2e75f76d46e4a57c28866a10a1e0d2 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Tunde_a
shows "(((((a_CONSTANTunde_Sunde_a) \<inter> (a_CONSTANTunde_Tunde_a))) \<subseteq> (((a_CONSTANTunde_Tunde_a) \<union> (a_CONSTANTunde_Sunde_a)))))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by (auto, blast)
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unknown
---*)
