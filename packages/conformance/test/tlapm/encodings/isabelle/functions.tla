(*---
description: 'Function application is fapply, a constructor is [x \<in> S \<mapsto> e], and EXCEPT and DOMAIN keep their TLA+ syntax.'
ref: src/backend/isabelle.ml#fmt_expr
mode: encoding
outcome: proved
---*)
---- MODULE functions ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW a \in S, NEW b PROVE [[x \in S |-> x] EXCEPT ![a] = b][a] = b /\ DOMAIN [x \in S |-> x] = S
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

    File "./functions.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory functions imports Constant Zenon begin
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
    fixes a_CONSTANTunde_aunde_a
    assumes a_CONSTANTunde_aunde_a_in : "(a_CONSTANTunde_aunde_a \<in> (a_CONSTANTunde_Sunde_a))"
    fixes a_CONSTANTunde_bunde_a
    shows "(((((fapply (([([ a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a)  \<mapsto> (a_CONSTANTunde_xunde_a)]) EXCEPT ![(a_CONSTANTunde_aunde_a)] = (a_CONSTANTunde_bunde_a)]), (a_CONSTANTunde_aunde_a))) = (a_CONSTANTunde_bunde_a))) \<and> ((((DOMAIN ([ a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a)  \<mapsto> (a_CONSTANTunde_xunde_a)]))) = (a_CONSTANTunde_Sunde_a)))))"(is "PROP ?ob'1")
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

    (* Generated from file "./functions.tla", line 10, characters 3-4 *)
    lemma ob'1: (* b6d3449070cfe4a93d1d3c0851249212 *)
    (* usable definition CONSTANT_EnabledWrapper_ suppressed *)
    (* usable definition CONSTANT_CdotWrapper_ suppressed *)
    fixes a_CONSTANTunde_Sunde_a
    fixes a_CONSTANTunde_aunde_a
    assumes a_CONSTANTunde_aunde_a_in : "(a_CONSTANTunde_aunde_a \<in> (a_CONSTANTunde_Sunde_a))"
    fixes a_CONSTANTunde_bunde_a
    shows "(((((fapply (([([ a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a)  \<mapsto> (a_CONSTANTunde_xunde_a)]) EXCEPT ![(a_CONSTANTunde_aunde_a)] = (a_CONSTANTunde_bunde_a)]), (a_CONSTANTunde_aunde_a))) = (a_CONSTANTunde_bunde_a))) \<and> ((((DOMAIN ([ a_CONSTANTunde_xunde_a \<in> (a_CONSTANTunde_Sunde_a)  \<mapsto> (a_CONSTANTunde_xunde_a)]))) = (a_CONSTANTunde_Sunde_a)))))"(is "PROP ?ob'1")
    proof -
    show "PROP ?ob'1"
    using assms by auto
    qed
    end
---*)
