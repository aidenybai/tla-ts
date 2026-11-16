(*---
description: Zenon cannot write a decimal constant, so the obligation fails as an unsupported operator.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: failed
---*)
---- MODULE real_constant ----
EXTENDS Reals, TLAPS
THEOREM 1.5 = 1.5
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
    @reason: Zenon: unsupported operator Real number constants
    @already: false
    @obl: 
    ASSUME TRUE 
    PROVE  1.5 = 1.5

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

    File "./real_constant.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME Zenon 
               PROVE  1.5 = 1.5
    File "./real_constant.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"real_constant"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory real_constant imports Constant Zenon begin
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
