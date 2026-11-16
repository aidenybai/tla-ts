(*---
description: The SMT encoding has no symbol for Real, so standardization rejects it and the obligation fails with that message.
ref: src/encode/n_standardize.ml#main
mode: encoding
outcome: failed
---*)
---- MODULE real_set ----
EXTENDS Reals, TLAPS
THEOREM \A a \in Real : a = a
  BY SMT
====

(*--- recorded
all:
  exit: 10
  transcript: |
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: failed
    @prover: smt
    @meth: time-limit: 5
    @reason: Encode.Standardize: Unexpected builtin 'Real'
    @already: false
    @obl: 
    ASSUME TRUE 
    PROVE  \A a \in Real : a = a

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

    File "./real_set.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME SMT 
               PROVE  \A a \in Real : a = a
    File "./real_set.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"real_set"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory real_set imports Constant Zenon begin
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

    end

    --- z3
---*)
