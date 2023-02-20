/**
 * @jest-environment jsdom
 */
import BillsUI from "../views/BillsUI"
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router";


jest.mock("../app/store", () => mockStore);


describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
    })
  );
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon.className).toBe("active-icon");
    });
  });
});
describe("when I submit the form with empty fields", () => {
  test("then I should stay on new Bill page", () => {
    window.onNavigate(ROUTES_PATH.NewBill);
    const newBill = new NewBill({
      document,
      onNavigate,
      mockStore,
      localStorage: window.localStorage,
    });

    expect(screen.getByTestId("expense-name").value).toBe("");
    expect(screen.getByTestId("datepicker").value).toBe("");
    expect(screen.getByTestId("amount").value).toBe("");
    expect(screen.getByTestId("vat").value).toBe("");
    expect(screen.getByTestId("pct").value).toBe("");
    expect(screen.getByTestId("file").value).toBe("");

    const form = screen.getByTestId("form-new-bill");
    const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

    form.addEventListener("submit", handleSubmit);
    fireEvent.submit(form);
    expect(handleSubmit).toHaveBeenCalled();
    expect(form).toBeTruthy();
  });
});
describe("When I select an image in a correct format", () => {
  test("Then the input file should display the file name", () => {
    //page NewBill
    const html = NewBillUI();
    document.body.innerHTML = html;
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    // initialisation NewBill
    const newBill = new NewBill({
      document,
      onNavigate,
      mockStore,
      localStorage: window.localStorage,
    });
    const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
    const input = screen.getByTestId("file");
    input.addEventListener("change", handleChangeFile);
    //fichier au bon format
    fireEvent.change(input, {
      target: {
        files: [
          new File(["image.png"], "image.png", {
            type: "image/png",
          }),
        ],
      },
    });
    expect(handleChangeFile).toHaveBeenCalled();
    expect(input.files[0].name).toBe("image.png");
  });
  test("Then a bill is created", () => {
    //page NewBill
    const html = NewBillUI();
    document.body.innerHTML = html;
    const onNavigate = jest.fn();
    // initialisation NewBill
    const newBill = new NewBill({
      document,
      onNavigate,
      mockStore: null,
      localStorage: window.localStorage,
    });
    //fonctionnalité submit
    const submit = screen.getByTestId("form-new-bill");
    fireEvent.submit(submit);
    expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
  });
});
describe("When I select a file with an incorrect extension", () => {
  test("Then the bill is deleted", () => {
    //page NewBill
    const html = NewBillUI();
    document.body.innerHTML = html;
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    // initialisation NewBill
    const newBill = new NewBill({
      document,
      onNavigate,
      mockStore: null,
      localStorage: window.localStorage,
    });
    // fonctionnalité séléction fichier
    const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
    const input = screen.getByTestId("file");
    input.addEventListener("change", handleChangeFile);
    //fichier au mauvais format
    fireEvent.change(input, {
      target: {
        files: [
          new File(["image.txt"], "image.txt", {
            type: "image/txt",
          }),
        ],
      },
    });
    expect(handleChangeFile).toHaveBeenCalled();
    expect(input.files[0].name).toBe("image.txt");
  });
});

//test d'intégration POST

describe("Given I am connected as Employee on NewBill page, and submit the form", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills");

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
  });

  describe("when APi is working well", () => {
    test("then i should be sent on bills page with bills updated", async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage: localStorageMock,
      });

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      expect(mockStore.bills).toHaveBeenCalled();
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });




  describe("When an error occurs on API", () => {
    test("then it should display a message error", async () => {
      console.error = jest.fn();
      window.onNavigate(ROUTES_PATH.NewBill);
      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur"));
          },
        };
      });

      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      });

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();

      await new Promise(process.nextTick);

      expect(console.error).toHaveBeenCalled();
    });
  });
});




