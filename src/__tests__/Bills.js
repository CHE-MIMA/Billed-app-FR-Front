/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression

      expect(windowIcon.className).toBe("active-icon");

      /**
       * ------------------------------------------------------------------------
       */

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})
/**
   * -----ajout nouveaux tests --------------
   * -----------------------------------------
   */
describe("When I click on button new-bill", () => {
  test("Then the modal new Bill should open", () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    const bill = new Bills({
      document,
      onNavigate,
      mockStore,
      localStorage: window.localStorage,
    });

    const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill(e));
    const buttonNewBill = screen.getByTestId("btn-new-bill");
    buttonNewBill.addEventListener("click", handleClickNewBill);
    userEvent.click(buttonNewBill);
    expect(handleClickNewBill).toHaveBeenCalled();
    expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    expect(screen.getByTestId("form-new-bill")).toBeTruthy();
  });
});

describe("When I click on an icon eye", () => {
  test("A modal should open with bill proof", () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    document.body.innerHTML = BillsUI({ data: bills });
    $.fn.modal = jest.fn();

    const bill = new Bills({
      document,
      onNavigate,
      mockStore,
      localStorage: window.localStorage,
    });

    const iconEye = screen.getAllByTestId("icon-eye");
    const handleClickIconEye = jest.fn((icon) =>
      bill.handleClickIconEye(icon)
    );
    iconEye.forEach((icon) => {
      icon.addEventListener("click", (e) => handleClickIconEye(icon));
      userEvent.click(icon);
    });

    expect(handleClickIconEye).toHaveBeenCalled();
    expect(screen.getAllByText("Justificatif")).toBeTruthy();
  });
});
// test d'intégration GET
describe("Given I am a user connected as Employée", () => {
  describe("When I navigate to Bills pages", () => {
    test("fetches bills from mock API GET", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      localStorage.setItem("user", JSON.stringify({ type: "Employée", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      const pathname = ROUTES_PATH["Bills"];
      root.innerHTML = ROUTES({ pathname: pathname, loading: true });
      //mock bills
      const bills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });
      bills.getBills().then((data) => {
        root.innerHTML = BillsUI({ data });
        expect(document.querySelector("tbody").rows.length).toBeGreaterThan(0);
      });
    });
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
    test("Then it fails with a 404 message error", async () => {
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("Then it fails with a 500 message error", async () => {
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});






