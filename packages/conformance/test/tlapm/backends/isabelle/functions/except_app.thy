(*---
description: auto proves [f EXCEPT ![x] = y][x] = y for x \in DOMAIN f.
ref: isabelle/Functions.thy#applyExcept
outcome: unsat
---*)
(* automatically generated -- do not edit manually *)
theory except_app imports Constant Zenon begin
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
lemma ob'1: (* 6b34c74f5fb5da92c76586dcf779b94c *)
(* usable definition CONSTANT_EnabledWrapper_ suppressed *)
(* usable definition CONSTANT_CdotWrapper_ suppressed *)
fixes a_CONSTANTunde_funde_a
fixes a_CONSTANTunde_xunde_a
fixes a_CONSTANTunde_yunde_a
shows "(((((a_CONSTANTunde_xunde_a) \<in> ((DOMAIN (a_CONSTANTunde_funde_a))))) \<Rightarrow> (((fapply (([(a_CONSTANTunde_funde_a) EXCEPT ![(a_CONSTANTunde_xunde_a)] = (a_CONSTANTunde_yunde_a)]), (a_CONSTANTunde_xunde_a))) = (a_CONSTANTunde_yunde_a)))))"(is "PROP ?ob'1")
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
