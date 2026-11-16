(*---
description: Zenon cannot write a function constructor with two bound variables, so the obligation fails as an unsupported operator.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: failed
---*)
---- MODULE constructor_two_bounds ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW a \in S PROVE [x \in S, y \in S |-> x][a, a] = a
  BY Zenon
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
    @prover: zenon
    @meth: time-limit: 10
    @reason: Zenon: unsupported operator Fcn (multiple declared constants)
    @already: false
    @obl: 
    ASSUME NEW CONSTANT S,
           NEW CONSTANT a \in S,
           TRUE 
    PROVE  [x \in S, y \in S |-> x][a, a] = a

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./constructor_two_bounds.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT S,
                      NEW CONSTANT a \in S,
                      Zenon 
               PROVE  [x \in S, y \in S |-> x][a, a] = a
    File "./constructor_two_bounds.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"constructor_two_bounds"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory constructor_two_bounds imports Constant Zenon begin
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

    --- zenon
---*)
