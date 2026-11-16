(*---
description: The tactic of the pragma is written verbatim after by.
ref: src/backend/isabelle.ml#thy_temp
mode: encoding
outcome: proved
---*)
---- MODULE tactic_text ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW T, \A x : x \in S <=> x \in T PROVE S = T
  BY IsaWithSetExtensionality
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
    @meth: (auto intro: setEqualI); time-limit: 30
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:30
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./tactic_text.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory tactic_text imports Constant Zenon begin
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
    fixes a_CONSTANTunde_Tunde_a
    assumes v'6: "(\<forall>a_CONSTANTunde_xunde_a : (((((a_CONSTANTunde_xunde_a) \<in> (a_CONSTANTunde_Sunde_a))) \<Leftrightarrow> (((a_CONSTANTunde_xunde_a) \<in> (a_CONSTANTunde_Tunde_a))))))"
    shows "(((a_CONSTANTunde_Sunde_a) = (a_CONSTANTunde_Tunde_a)))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"
    using assms by (auto intro: setEqualI)
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

    (* Generated from file "./tactic_text.tla", line 10, characters 3-4 *)
    lemma ob'1: (* cd4892c7d8e5ca09ce2fae923f80b5a8 *)
    (* usable definition CONSTANT_EnabledWrapper_ suppressed *)
    (* usable definition CONSTANT_CdotWrapper_ suppressed *)
    fixes a_CONSTANTunde_Sunde_a
    fixes a_CONSTANTunde_Tunde_a
    assumes v'6: "(\<forall>a_CONSTANTunde_xunde_a : (((((a_CONSTANTunde_xunde_a) \<in> (a_CONSTANTunde_Sunde_a))) \<Leftrightarrow> (((a_CONSTANTunde_xunde_a) \<in> (a_CONSTANTunde_Tunde_a))))))"
    shows "(((a_CONSTANTunde_Sunde_a) = (a_CONSTANTunde_Tunde_a)))"(is "PROP ?ob'1")
    proof -
    show "PROP ?ob'1"
    using assms by (auto intro: setEqualI)
    qed
    end
---*)
