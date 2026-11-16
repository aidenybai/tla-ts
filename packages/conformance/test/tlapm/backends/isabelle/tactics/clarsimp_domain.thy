(*---
description: BY Simplification runs clarsimp, which rewrites DOMAIN [a \in S |-> F(a)] to S.
ref: library/TLAPS.tla#Simplification
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory clarsimp_domain imports Constant Zenon begin
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
lemma ob'1: (* cae0a5ee5b00e08e1d911dfaead58085 *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_Sunde_a
fixes a_CONSTANTunde_Funde_a
shows "((((DOMAIN ([ a_CONSTANTunde_aunde_a \<in> (a_CONSTANTunde_Sunde_a)  \<mapsto> ((a_CONSTANTunde_Funde_a ((a_CONSTANTunde_aunde_a))))]))) = (a_CONSTANTunde_Sunde_a)))"(is "PROP ?ob'1")
proof -
show "PROP ?ob'1"
by clarsimp
qed
end

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
