(*---
description: Zenon cannot write \EE, so the obligation fails as an unsupported operator.
ref: src/backend/zenon.ml#fmt_expr
mode: encoding
outcome: failed
---*)
---- MODULE temporal_quantifier ----
EXTENDS TLAPS
VARIABLE x
THEOREM \EE z : z = x
  BY Zenon
====

(*--- recorded
all:
  exit: 10
  transcript: |
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: failed
    @prover: zenon
    @meth: time-limit: 10
    @reason: Zenon: unsupported operator \AA or \EE
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           TRUE 
    PROVE  \EE z : z = x

    @type: obligation
    @id: 2
    @loc: 11:6:11:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./temporal_quantifier.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      Zenon 
               PROVE  \EE z : z = x
    File "./temporal_quantifier.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"temporal_quantifier"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory temporal_quantifier imports Constant Zenon begin
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
