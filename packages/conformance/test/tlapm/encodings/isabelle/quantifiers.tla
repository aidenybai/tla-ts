(*---
description: Bounded quantifiers are written with \<forall> and \<exists> over a set, and unbounded ones without.
ref: src/backend/isabelle.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE quantifiers ----
EXTENDS TLAPS
THEOREM ASSUME NEW S PROVE \A x \in S : \E y : y = x
  BY Isa
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: proved
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./quantifiers.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory quantifiers imports Constant Zenon begin
    ML_command \<open> writeln ("*** TLAPS PARSED\n"); \<close>
    consts
      "isReal" :: c
      "isa_slas_a" :: "[c,c] => c"
      "isa_bksl_diva" :: "[c,c] => c"
      "isa_perc_a" :: "[c,c] => c"
      "isa_peri_peri_a" :: "[c,c] => c"
      "isInfinity" :: c
      "isa_lbrk_rbrk_a" :: "[c] => c"
      "isa_less_more_a" :: "[c] => c"

    lemma ob'1:
    (* usable definition CONSTANT_EnabledWrapper_ suppressed *)
    (* usable definition CONSTANT_CdotWrapper_ suppressed *)
    fixes a_CONSTANTunde_Sunde_a
    shows "(\<forall> a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a) : (\<exists>a_CONSTANTunde_yunde_a : (((a_CONSTANTunde_yunde_a) = (a_CONSTANTunde_xunde_a)))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"
    using assms by auto
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory tlapm_<id> imports Constant Zenon begin
    consts
      "isReal" :: c
      "isa_slas_a" :: "[c,c] => c"
      "isa_bksl_diva" :: "[c,c] => c"
      "isa_perc_a" :: "[c,c] => c"
      "isa_peri_peri_a" :: "[c,c] => c"
      "isInfinity" :: c
      "isa_lbrk_rbrk_a" :: "[c] => c"
      "isa_less_more_a" :: "[c] => c"

    (* Generated from file "./quantifiers.tla", line 10, characters 3-4 *)
    lemma ob'1: (* 09e639b96e6ee28a20c84447c44de3ea *)
    (* usable definition CONSTANT_EnabledWrapper_ suppressed *)
    (* usable definition CONSTANT_CdotWrapper_ suppressed *)
    fixes a_CONSTANTunde_Sunde_a
    shows "(\<forall> a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a) : (\<exists>a_CONSTANTunde_yunde_a : (((a_CONSTANTunde_yunde_a) = (a_CONSTANTunde_xunde_a)))))"(is "PROP ?ob'1")
    proof -
    show "PROP ?ob'1"
    by auto
    qed
    end
---*)
