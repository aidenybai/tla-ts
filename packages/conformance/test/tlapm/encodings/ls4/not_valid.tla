(*---
description: When the negated obligation is satisfiable, LS4 answers SAT and the obligation fails with reason false.
ref: src/backend/prep.ml#ls4_prove
mode: encoding
outcome: failed
---*)
---- MODULE not_valid ----
EXTENDS Naturals, TLAPS
VARIABLE x, y
THEOREM <>(x = 1) => [](x = 1)
  BY PTL
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           NEW VARIABLE y,
           TRUE 
    PROVE  <>(x = 1) => [](x = 1)

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

    File "./not_valid.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW VARIABLE y,
                      PTL 
               PROVE  <>(x = 1) => [](x = 1)
    File "./not_valid.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"not_valid"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory not_valid imports Constant Zenon begin
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

    --- ls4
    not (((always (cc | ~ cc)) -> ((sometime h7fe4a) -> (always h7fe4a))))
---*)
