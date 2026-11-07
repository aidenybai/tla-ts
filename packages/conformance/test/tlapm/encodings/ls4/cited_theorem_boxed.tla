(*---
description: A cited theorem holds at all times, so PTL boxes it.
ref: src/frontend/pltl.ml#box_assumptions
mode: encoding
outcome: incomplete
---*)
---- MODULE cited_theorem_boxed ----
EXTENDS Naturals, TLAPS
VARIABLE x, y
THEOREM Inv == x = 1
  OMITTED
THEOREM [](x = 1)
  BY Inv, PTL
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 13:3:13:5
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 13:3:13:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 3
    @loc: 13:6:13:9
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 13:6:13:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 13:11:13:14
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 13:11:13:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    Omitted proof at File "./cited_theorem_boxed.tla", line 11, characters 3-9
    File "./cited_theorem_boxed.tla", line 7, character 1 to line 14, character 4:
    [ERROR]: Proof incomplete in module "cited_theorem_boxed": 0 missing, 1 omitted proof step(s).
    File "./cited_theorem_boxed.tla", line 7, character 1 to line 14, character 4:
    [INFO]: All 3 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory cited_theorem_boxed imports Constant Zenon begin
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
    not (((always h7fe4a) & (always (cc | ~ cc)) -> (always h7fe4a)))
---*)
