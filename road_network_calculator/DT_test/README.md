# DT Test Suite

This folder contains design-test cases for the batch route calculation feature.

Run functional tests:

```powershell
python -m pytest DT_test
```

Run a reproducible performance DT:

```powershell
python DT_test\performance_dt.py --grid-size 220 --pairs 2000 --workers 4
```

For larger local stress tests, increase `--grid-size` and `--pairs`. The generated road network is a synthetic WKT grid, so the test does not require internet access.
