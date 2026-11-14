(*---
description: An earlier named theorem has the time Always even when it is a state predicate, so citing it in a Now scope gives PTL a boxed fact. The earlier theorem's omitted proof makes the run incomplete.
ref: src/module/m_gen.ml#generate
args: ["--method", "ls4"]
mode: encoding
outcome: incomplete
---*)
---- MODULE theorem_fact_always ----
EXTENDS TLAPS
VARIABLE x, y
THEOREM T == x = 0
  OMITTED
THEOREM ASSUME y = 1 PROVE [](x = 0)
  BY ONLY T, PTL
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 14:3:14:5
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 14:3:14:5
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 3
    @loc: 14:11:14:12
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 14:11:14:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 14:14:14:17
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 14:14:14:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    Omitted proof at File "./theorem_fact_always.tla", line 12, characters 3-9
    File "./theorem_fact_always.tla", line 8, character 1 to line 15, character 4:
    [ERROR]: Proof incomplete in module "theorem_fact_always": 0 missing, 1 omitted proof step(s).
    File "./theorem_fact_always.tla", line 8, character 1 to line 15, character 4:
    [INFO]: All 3 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory theorem_fact_always imports Constant Zenon begin
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
    not (((always h4ca64) -> (always h4ca64)))
---*)
