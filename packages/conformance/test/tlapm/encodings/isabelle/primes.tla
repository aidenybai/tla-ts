(*---
description: 'The fixes list a variable and its primed copy, but the goal refers to x'' by the separate name the action frontend gives it, written with the type annotation :: c.'
ref: src/frontend/action.ml#process_obligation
mode: encoding
outcome: proved
---*)
---- MODULE primes ----
EXTENDS TLAPS
VARIABLE x
THEOREM x' = 1 => x' = 1
  BY Isa
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: proved
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./primes.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory primes imports Constant Zenon begin
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
    fixes a_VARIABLEunde_xunde_a a_VARIABLEunde_xunde_a'
    shows "((((((a_VARIABLEunde_xunde_hash_primea :: c)) = ((succ[0])))) \<Rightarrow> ((((a_VARIABLEunde_xunde_hash_primea :: c)) = ((succ[0]))))))"(is "PROP ?ob'1")
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

    (* Generated from file "./primes.tla", line 11, characters 3-4 *)
    lemma ob'1: (* fc9ec1fa8b4cbbcb89b54eea60f270eb *)
    (* usable definition CONSTANT_EnabledWrapper_ suppressed *)
    (* usable definition CONSTANT_CdotWrapper_ suppressed *)
    fixes a_VARIABLEunde_xunde_a a_VARIABLEunde_xunde_a'
    shows "((((((a_VARIABLEunde_xunde_hash_primea :: c)) = ((succ[0])))) \<Rightarrow> ((((a_VARIABLEunde_xunde_hash_primea :: c)) = ((succ[0]))))))"(is "PROP ?ob'1")
    proof -
    show "PROP ?ob'1"
    by auto
    qed
    end
---*)
